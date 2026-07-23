import { withdrawalsRepository, type Withdrawal } from './withdrawals.repository';
import { creatorsRepository, type Creator } from '../creators/creators.repository';
import type { CurrencyCode } from '../creators/creator-balances.repository';
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
  ValidationError,
} from '../../shared/errors';

const COOLDOWN_MS = env.WITHDRAWAL_COOLDOWN_HOURS * 60 * 60 * 1000;

export const withdrawalsService = {
  async requestOnDemandWithdrawal(
    creatorId: string,
    amount?: string,
    currency?: CurrencyCode,
  ): Promise<Withdrawal> {
    const creator = await creatorsRepository.findById(creatorId);
    if (!creator) {
      throw new NotFoundError('Creator not found');
    }

    this.assertCooldownElapsed(creator);

    const withdrawCurrency = (currency ?? creator.payoutCurrency) as CurrencyCode;
    const available = await creatorsRepository.getBalance(creatorId, withdrawCurrency);

    // Payout method must match the withdrawal currency
    const payoutMethod = await payoutMethodsService.getVerifiedMethodOrThrow(creatorId);
    if (payoutMethod.currency !== withdrawCurrency) {
      throw new ValidationError(
        `Your verified payout method is in ${payoutMethod.currency}. Withdraw in ${payoutMethod.currency}, or update your payout method.`,
      );
    }

    const withdrawalAmount = amount || available;

    if (!isPositiveAmount(withdrawalAmount)) {
      throw new InsufficientBalanceError(available, withdrawalAmount);
    }

    const minimumAmount = fromMinorUnits(env.WITHDRAWAL_MIN_AMOUNT_MINOR, withdrawCurrency);
    if (!isAmountGte(available, minimumAmount)) {
      throw new BelowMinimumWithdrawalError(minimumAmount);
    }

    if (amount && !isAmountGte(available, withdrawalAmount)) {
      throw new InsufficientBalanceError(available, withdrawalAmount);
    }

    if (amount && !isAmountGte(withdrawalAmount, minimumAmount)) {
      throw new BelowMinimumWithdrawalError(minimumAmount);
    }

    const poolAccount = await poolAccountsService.getByCurrencyOrThrow(withdrawCurrency);

    return this.createAndQueue({
      creator,
      payoutMethodId: payoutMethod.id,
      poolAccountId: poolAccount.id,
      amount: withdrawalAmount,
      currency: withdrawCurrency,
      trigger: 'ON_DEMAND',
    });
  },

  async runScheduledSweep(): Promise<{ queued: number; skipped: number }> {
    const eligibleCreators = await creatorsRepository.findEligibleForScheduledSweep();
    let queued = 0;
    let skipped = 0;

    for (const creator of eligibleCreators) {
      try {
        const currency = creator.payoutCurrency as CurrencyCode;
        const available = await creatorsRepository.getBalance(creator.id, currency);
        if (!isPositiveAmount(available)) {
          skipped += 1;
          continue;
        }

        const payoutMethod = await payoutMethodsService.getVerifiedMethodOrThrow(creator.id);
        if (payoutMethod.currency !== currency) {
          skipped += 1;
          continue;
        }

        const poolAccount = await poolAccountsService.getByCurrencyOrThrow(currency);

        await this.createAndQueue({
          creator,
          payoutMethodId: payoutMethod.id,
          poolAccountId: poolAccount.id,
          amount: available,
          currency,
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
    currency: CurrencyCode;
    trigger: 'ON_DEMAND' | 'SCHEDULED';
  }): Promise<Withdrawal> {
    if (!isPositiveAmount(params.amount)) {
      const available = await creatorsRepository.getBalance(params.creator.id, params.currency);
      throw new InsufficientBalanceError(available, params.amount);
    }

    const withdrawal = await withdrawalsRepository.create({
      creatorId: params.creator.id,
      payoutMethodId: params.payoutMethodId,
      poolAccountId: params.poolAccountId,
      amount: params.amount,
      currency: params.currency,
      trigger: params.trigger,
      status: 'QUEUED',
    });

    await creatorsRepository.decrementBalance(
      params.creator.id,
      params.amount,
      params.currency,
    );
    await creatorsRepository.setLastWithdrawalAt(params.creator.id, new Date());

    await enqueueDisbursement(withdrawal.id);

    const user = await db.query.users.findFirst({ where: eq(users.id, params.creator.userId) });
    if (user) {
      const { sendWithdrawalConfirmation } = await import('../../infra/email/email.service');
      await sendWithdrawalConfirmation({
        user: { id: user.id, email: user.email, name: user.name },
        amount: params.amount,
        currency: params.currency,
      });
    }

    logger.info(
      {
        withdrawalId: withdrawal.id,
        creatorId: params.creator.id,
        amount: params.amount,
        currency: params.currency,
        trigger: params.trigger,
      },
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

  async listForCreator(creatorId: string, offset: number, limit: number) {
    return withdrawalsRepository.findByCreatorId(creatorId, offset, limit);
  },
};
