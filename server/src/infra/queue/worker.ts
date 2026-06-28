import { Worker, type Job } from 'bullmq';
import { redisConnection } from './redis-connection';
import type { DisbursementJobPayload } from './disbursement-queue';
import { registerScheduledSweep } from './scheduler';
import './scheduler'; // side-effect import: starts the scheduler's own Worker
import { withdrawalsRepository } from '../../modules/withdrawals/withdrawals.repository';
import { creatorsRepository } from '../../modules/creators/creators.repository';
import { poolAccountsRepository } from '../../modules/pool-accounts/pool-accounts.repository';
import { payoutMethodsRepository } from '../../modules/payout-methods/payout-methods.repository';
import { afriexClient } from '../afriex/afriex-client';
import { logger } from '../../config/logger';

// This worker is the only place that actually calls Afriex to move money.
// It is intentionally separate from the request/response cycle (per the
// architecture doc's principle: disbursement is always asynchronous) — the
// withdrawals.service has already debited the creator's balance and
// queued this job by the time it runs here.
//
// Run as its own process via `npm run worker:dev` / a separate deployment,
// not inside the Fastify server process — a slow or stuck Afriex call must
// never block the HTTP server's event loop or its other request handling.
async function processDisbursement(job: Job<DisbursementJobPayload>): Promise<void> {
  const { withdrawalId } = job.data;

  const withdrawal = await withdrawalsRepository.findById(withdrawalId);
  if (!withdrawal) {
    logger.error({ withdrawalId }, 'Withdrawal not found when processing disbursement job');
    return;
  }

  if (withdrawal.status === 'PAID') {
    logger.info({ withdrawalId }, 'Withdrawal already PAID, skipping (job retried after success)');
    return;
  }

  const [payoutMethod, poolAccount] = await Promise.all([
    payoutMethodsRepository.findById(withdrawal.payoutMethodId),
    poolAccountsRepository.findById(withdrawal.poolAccountId),
  ]);

  if (!payoutMethod || !poolAccount) {
    await failWithdrawal(withdrawal, 'Payout method or pool account no longer exists');
    return;
  }

  try {
    const transfer = await afriexClient.createTransfer({
      customerId: payoutMethod.afriexCustomerId,
      paymentMethodId: payoutMethod.afriexPaymentMethodId,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      idempotencyKey: withdrawal.id,
    });

    await withdrawalsRepository.markProcessing(withdrawal.id, transfer.afriexTransactionId);
    await poolAccountsRepository.decrementBalance(poolAccount.id, withdrawal.amount);

    // Some Afriex rails settle synchronously and return COMPLETED inline;
    // others are async and confirm later via webhook (handled in
    // infra/afriex/afriex-webhook.router.ts, which calls markPaid/markFailed
    // directly). Only mark PAID here if Afriex told us it's already done.
    if (transfer.status === 'COMPLETED') {
      await withdrawalsRepository.markPaid(withdrawal.id);
      logger.info({ withdrawalId: withdrawal.id }, 'Disbursement completed synchronously');
    } else {
      logger.info({ withdrawalId: withdrawal.id }, 'Disbursement submitted, awaiting Afriex confirmation');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling Afriex';
    logger.error({ err, withdrawalId: withdrawal.id }, 'Disbursement attempt failed');

    // Let BullMQ's retry/backoff handle transient errors (it will re-invoke
    // this function up to the queue's configured `attempts`). Only credit
    // the balance back and mark FAILED once retries are exhausted —
    // job.attemptsMade is 1-indexed and opts.attempts is the ceiling.
    const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    if (isFinalAttempt) {
      await failWithdrawal(withdrawal, message);
    } else {
      throw err; // re-throw so BullMQ schedules a retry
    }
  }
}

async function failWithdrawal(
  withdrawal: { id: string; creatorId: string; amount: string },
  reason: string,
): Promise<void> {
  await withdrawalsRepository.markFailed(withdrawal.id, reason);
  // Credit the creator's balance back — the optimistic debit made at
  // withdrawal creation must be reversed since the money never actually
  // left the pool account.
  await creatorsRepository.incrementBalance(withdrawal.creatorId, withdrawal.amount);
  logger.warn({ withdrawalId: withdrawal.id, reason }, 'Withdrawal failed, balance credited back');
}

export const disbursementWorker = new Worker<DisbursementJobPayload>('disbursements', processDisbursement, {
  connection: redisConnection,
  concurrency: 5,
});

disbursementWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Disbursement job failed after all retries');
});

await registerScheduledSweep();

logger.info('Disbursement worker started');
