import { Worker, type Job } from 'bullmq';
import { redisConnection } from './redis-connection';
import type { DisbursementJobPayload } from './disbursement-queue';
import { registerScheduledSweep } from './scheduler';
import './scheduler';
import { withdrawalsRepository } from '../../modules/withdrawals/withdrawals.repository';
import { creatorsRepository } from '../../modules/creators/creators.repository';
import { poolAccountsRepository } from '../../modules/pool-accounts/pool-accounts.repository';
import { payoutMethodsRepository } from '../../modules/payout-methods/payout-methods.repository';
import { afriexClient } from '../afriex/afriex-client';
import { db } from '../../config/db';
import { users, creators } from '../database/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../config/logger';
import { sendWithdrawalCompleted, sendWithdrawalFailed } from '../email/email.service';

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

    if (transfer.status === 'COMPLETED') {
      await withdrawalsRepository.markPaid(withdrawal.id);
      logger.info({ withdrawalId: withdrawal.id }, 'Disbursement completed synchronously');
      await notifyUser(withdrawal.creatorId, {
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
    if (isFinalAttempt) {
      await failWithdrawal(withdrawal, message);
      await notifyUser(withdrawal.creatorId, {
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: 'FAILED',
        reason: message,
      });
    } else {
      throw err;
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

async function notifyUser(
  creatorId: string,
  params: { amount: string; currency: string; status: string; reason?: string },
): Promise<void> {
  try {
    const creator = await db.query.creators.findFirst({
      where: (c, { eq: e }) => e(c.id, creatorId),
      with: { user: true },
    });
    if (!creator?.user) return;

    const user = { id: creator.user.id, email: creator.user.email, name: creator.user.name };

    if (params.status === 'COMPLETED') {
      await sendWithdrawalCompleted({ user, amount: params.amount, currency: params.currency });
    } else if (params.status === 'FAILED' && params.reason) {
      await sendWithdrawalFailed({ user, amount: params.amount, currency: params.currency, reason: params.reason });
    }
  } catch (err) {
    logger.error({ err, creatorId }, 'Failed to send withdrawal notification email');
  }
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
