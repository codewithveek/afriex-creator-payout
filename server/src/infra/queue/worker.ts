import { Worker, type Job } from 'bullmq';
import { ApiError, RateLimitError } from '@afriex/sdk';
import { redisConnection } from './redis-connection';
import type { DisbursementJobPayload } from './disbursement-queue';
import { registerScheduledSweep } from './scheduler';
import './scheduler';
import { withdrawalsRepository } from '../../modules/withdrawals/withdrawals.repository';
import { creatorsRepository } from '../../modules/creators/creators.repository';
import { notifyWithdrawalOutcome } from '../../modules/withdrawals/withdrawal-notifications';
import { poolAccountsRepository } from '../../modules/pool-accounts/pool-accounts.repository';
import { payoutMethodsRepository } from '../../modules/payout-methods/payout-methods.repository';
import { afriexClient } from '../afriex/afriex-client';
import { logger } from '../../config/logger';

/**
 * True only when Afriex explicitly rejected the request (a 4xx response
 * body we can read, excluding 408/429 which the SDK already retries
 * transparently). False for timeouts, network errors, and 5xx — none of
 * those prove the transfer didn't happen, so they must never be treated as
 * "safe to credit the balance back".
 */
function isDefiniteRejection(err: unknown): boolean {
  if (err instanceof RateLimitError) return false;
  if (err instanceof ApiError) {
    return err.statusCode >= 400 && err.statusCode < 500 && err.statusCode !== 408 && err.statusCode !== 429;
  }
  return false;
}

async function processDisbursement(job: Job<DisbursementJobPayload>): Promise<void> {
  const { withdrawalId } = job.data;

  const withdrawal = await withdrawalsRepository.findById(withdrawalId);
  if (!withdrawal) {
    logger.error({ withdrawalId }, 'Withdrawal not found when processing disbursement job');
    return;
  }

  if (withdrawal.status === 'PAID' || withdrawal.status === 'PROCESSING') {
    logger.info(
      { withdrawalId, status: withdrawal.status },
      'Withdrawal already reached Afriex on a prior attempt, skipping to avoid double-debiting the pool account',
    );
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

    if (transfer.status === 'COMPLETED') {
      await withdrawalsRepository.markPaid(withdrawal.id);
      logger.info({ withdrawalId: withdrawal.id }, 'Disbursement completed synchronously');
      await notifyWithdrawalOutcome(withdrawal.creatorId, {
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: 'COMPLETED',
      });
    } else {
      logger.info({ withdrawalId: withdrawal.id }, 'Disbursement submitted, awaiting Afriex confirmation');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling Afriex';
    logger.error({ err, withdrawalId: withdrawal.id }, 'Disbursement attempt failed');

    const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    if (!isFinalAttempt) {
      throw err;
    }

    if (isDefiniteRejection(err)) {
      await failWithdrawal(withdrawal, message);
      await notifyWithdrawalOutcome(withdrawal.creatorId, {
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: 'FAILED',
        reason: message,
      });
    } else {
      // Timeout / 5xx / network error on the final attempt: Afriex may have
      // already processed the transfer. Do NOT credit the balance back —
      // that would double-pay the creator if the transfer in fact went
      // through. Park it for manual reconciliation against Afriex by this
      // withdrawal's id (the idempotency key sent on every transfer).
      await withdrawalsRepository.markUnknown(withdrawal.id, message);
      logger.error(
        { withdrawalId: withdrawal.id, reason: message },
        'Disbursement outcome unknown after final attempt — needs manual reconciliation against Afriex',
      );
    }
  }
}

async function failWithdrawal(
  withdrawal: { id: string; creatorId: string; amount: string; currency: string },
  reason: string,
): Promise<void> {
  await withdrawalsRepository.markFailed(withdrawal.id, reason);
  await creatorsRepository.incrementBalance(
    withdrawal.creatorId,
    withdrawal.amount,
    withdrawal.currency as 'USD' | 'NGN' | 'GHS' | 'KES',
  );
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
