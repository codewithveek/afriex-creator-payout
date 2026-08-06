import { eq } from 'drizzle-orm';
import { withdrawalsRepository, type Withdrawal } from './withdrawals.repository';
import { creatorsRepository, type Creator } from '../creators/creators.repository';
import { creatorBalancesRepository, type CurrencyCode } from '../creators/creator-balances.repository';
import { payoutMethodsService } from '../payout-methods/payout-methods.service';
import { poolAccountsService } from '../pool-accounts/pool-accounts.service';
import { enqueueDisbursement } from '../../infra/queue/disbursement-queue';
import { fromMinorUnits, isAmountGte, isPositiveAmount } from '../../shared/utils/currency';
import { env } from '../../config/env';
import { db } from '../../config/db';
import { users, creators } from '../../infra/database/schema';
import { logger } from '../../config/logger';
import {
  BelowMinimumWithdrawalError,
  WithdrawalCooldownError,
  InsufficientBalanceError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors';

const COOLDOWN_MS = env.WITHDRAWAL_COOLDOWN_HOURS * 60 * 60 * 1000;

function cooldownRemainingHours(lastWithdrawalAt: Date): number {
  const elapsedMs = Date.now() - lastWithdrawalAt.getTime();
  return Math.ceil((COOLDOWN_MS - elapsedMs) / (60 * 60 * 1000));
}

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

    // The checks above are for a fast, friendly error message — they read
    // outside any lock and can be stale by the time we get here. The
    // transaction inside createAndQueue re-validates the cooldown and
    // balance under a row lock / conditional update, so a second concurrent
    // request from the same creator cannot slip past both checks and debit
    // twice.
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

    // Everything that reserves funds happens in one transaction: lock the
    // creator row (serializing concurrent withdrawal attempts from the same
    // creator), re-check the cooldown against that locked row, debit the
    // balance with a conditional UPDATE that can't take it negative, create
    // the withdrawal row, and stamp lastWithdrawalAt — all or nothing. A
    // crash between any of these steps rolls the whole thing back instead
    // of leaving a QUEUED withdrawal against funds that were never debited.
    const withdrawal = await db.transaction(async (tx) => {
      const [lockedCreator] = await tx
        .select({ lastWithdrawalAt: creators.lastWithdrawalAt })
        .from(creators)
        .where(eq(creators.id, params.creator.id))
        .for('update');

      if (lockedCreator?.lastWithdrawalAt) {
        const elapsedMs = Date.now() - lockedCreator.lastWithdrawalAt.getTime();
        if (elapsedMs < COOLDOWN_MS) {
          throw new WithdrawalCooldownError(cooldownRemainingHours(lockedCreator.lastWithdrawalAt));
        }
      }

      const debited = await creatorBalancesRepository.decrement(
        params.creator.id,
        params.currency,
        params.amount,
        tx,
      );
      if (!debited) {
        const available = await creatorBalancesRepository.getBalance(params.creator.id, params.currency, tx);
        throw new InsufficientBalanceError(available, params.amount);
      }

      const row = await withdrawalsRepository.create(
        {
          creatorId: params.creator.id,
          payoutMethodId: params.payoutMethodId,
          poolAccountId: params.poolAccountId,
          amount: params.amount,
          currency: params.currency,
          trigger: params.trigger,
          status: 'QUEUED',
        },
        tx,
      );

      await creatorsRepository.setLastWithdrawalAt(params.creator.id, new Date(), tx);

      return row;
    });

    await enqueueDisbursement(withdrawal.id);

    // Confirmation email is best-effort and outside the critical path — it
    // must never fail (or even slow down) a withdrawal that already
    // succeeded and was already queued for disbursement. sendWithdrawalConfirmation
    // already catches and logs its own errors internally.
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
      throw new WithdrawalCooldownError(cooldownRemainingHours(creator.lastWithdrawalAt));
    }
  },

  async listForCreator(creatorId: string, offset: number, limit: number) {
    return withdrawalsRepository.findByCreatorId(creatorId, offset, limit);
  },
};
