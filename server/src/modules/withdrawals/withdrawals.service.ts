import { withdrawalsRepository, type Withdrawal } from './withdrawals.repository';
import { creatorsRepository, type Creator } from '../creators/creators.repository';
import { payoutMethodsService } from '../payout-methods/payout-methods.service';
import { poolAccountsService } from '../pool-accounts/pool-accounts.service';
import { enqueueDisbursement } from '../../infra/queue/disbursement-queue';
import { fromMinorUnits, isAmountGte, isPositiveAmount } from '../../shared/utils/currency';
import { env } from '../../config/env';
import { db } from '../../config/db';
import { users } from '../../infra/database/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../config/logger';
import {
  BelowMinimumWithdrawalError,
  WithdrawalCooldownError,
  InsufficientBalanceError,
  NotFoundError,
} from '../../shared/errors';

const COOLDOWN_MS = env.WITHDRAWAL_COOLDOWN_HOURS * 60 * 60 * 1000;

export const withdrawalsService = {
  async requestOnDemandWithdrawal(creatorId: string, amount?: string): Promise<Withdrawal> {
    const creator = await creatorsRepository.findById(creatorId);
    if (!creator) {
      throw new NotFoundError('Creator not found');
    }

    this.assertCooldownElapsed(creator);

    const withdrawalAmount = amount || creator.availableBalance;

    if (!isPositiveAmount(withdrawalAmount)) {
      throw new InsufficientBalanceError(creator.availableBalance, withdrawalAmount);
    }

    if (withdrawalAmount !== creator.availableBalance) {
      const minimumAmount = fromMinorUnits(env.WITHDRAWAL_MIN_AMOUNT_MINOR, creator.payoutCurrency);
      if (!isAmountGte(withdrawalAmount, minimumAmount)) {
        throw new BelowMinimumWithdrawalError(minimumAmount);
      }
      if (!isAmountGte(creator.availableBalance, withdrawalAmount)) {
        throw new InsufficientBalanceError(creator.availableBalance, withdrawalAmount);
      }
    } else {
      const minimumAmount = fromMinorUnits(env.WITHDRAWAL_MIN_AMOUNT_MINOR, creator.payoutCurrency);
      if (!isAmountGte(creator.availableBalance, minimumAmount)) {
        throw new BelowMinimumWithdrawalError(minimumAmount);
      }
    }

    const payoutMethod = await payoutMethodsService.getVerifiedMethodOrThrow(creatorId);
    const poolAccount = await poolAccountsService.getByCurrencyOrThrow(creator.payoutCurrency);

    const withdrawal = await this.createAndQueue({
      creator,
      payoutMethodId: payoutMethod.id,
      poolAccountId: poolAccount.id,
      amount: withdrawalAmount,
      trigger: 'ON_DEMAND',
    });

    return withdrawal;
  },

  async runScheduledSweep(): Promise<{ queued: number; skipped: number }> {
    const eligibleCreators = await creatorsRepository.findEligibleForScheduledSweep();
    let queued = 0;
    let skipped = 0;

    for (const creator of eligibleCreators) {
      try {
        const payoutMethod = await payoutMethodsService.getVerifiedMethodOrThrow(creator.id);
        const poolAccount = await poolAccountsService.getByCurrencyOrThrow(creator.payoutCurrency);

        await this.createAndQueue({
          creator,
          payoutMethodId: payoutMethod.id,
          poolAccountId: poolAccount.id,
          amount: creator.availableBalance,
          trigger: 'SCHEDULED',
        });
        queued += 1;
      } catch (err) {
        logger.error({ err, creatorId: creator.id }, 'Scheduled sweep failed for creator, skipping');
        skipped += 1;
      }
    }

    logger.info({ queued, skipped }, 'Scheduled disbursement sweep complete');
    return { queued, skipped };
  },

  async createAndQueue(params: {
    creator: Creator;
    payoutMethodId: string;
    poolAccountId: string;
    amount: string;
    trigger: 'ON_DEMAND' | 'SCHEDULED';
  }): Promise<Withdrawal> {
    if (!isPositiveAmount(params.amount)) {
      throw new InsufficientBalanceError(params.creator.availableBalance, params.amount);
    }

    const withdrawal = await withdrawalsRepository.create({
      creatorId: params.creator.id,
      payoutMethodId: params.payoutMethodId,
      poolAccountId: params.poolAccountId,
      amount: params.amount,
      currency: params.creator.payoutCurrency,
      trigger: params.trigger,
      status: 'QUEUED',
    });

    await creatorsRepository.decrementBalance(params.creator.id, params.amount);
    await creatorsRepository.setLastWithdrawalAt(params.creator.id, new Date());

    await enqueueDisbursement(withdrawal.id);

    const user = await db.query.users.findFirst({ where: eq(users.id, params.creator.userId) });
    if (user) {
      const { sendWithdrawalConfirmation } = await import('../../infra/email/email.service');
      await sendWithdrawalConfirmation({
        user: { id: user.id, email: user.email, name: user.name },
        amount: params.amount,
        currency: params.creator.payoutCurrency,
      });
    }

    logger.info(
      { withdrawalId: withdrawal.id, creatorId: params.creator.id, amount: params.amount, trigger: params.trigger },
      'Withdrawal created and queued',
    );

    return withdrawal;
  },

  assertCooldownElapsed(creator: Creator): void {
    if (!creator.lastWithdrawalAt) return;

    const elapsedMs = Date.now() - creator.lastWithdrawalAt.getTime();
    if (elapsedMs < COOLDOWN_MS) {
      const remainingHours = Math.ceil((COOLDOWN_MS - elapsedMs) / (60 * 60 * 1000));
      throw new WithdrawalCooldownError(remainingHours);
    }
  },

  async listForCreator(creatorId: string): Promise<Withdrawal[]> {
    return withdrawalsRepository.findByCreatorId(creatorId);
  },
};
