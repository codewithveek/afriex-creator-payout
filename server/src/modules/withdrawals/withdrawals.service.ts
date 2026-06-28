import { withdrawalsRepository, type Withdrawal } from './withdrawals.repository';
import { creatorsRepository, type Creator } from '../creators/creators.repository';
import { payoutMethodsService } from '../payout-methods/payout-methods.service';
import { poolAccountsService } from '../pool-accounts/pool-accounts.service';
import { enqueueDisbursement } from '../../infra/queue/disbursement-queue';
import { fromMinorUnits, isAmountGte, isPositiveAmount } from '../../shared/utils/currency';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  BelowMinimumWithdrawalError,
  WithdrawalCooldownError,
  InsufficientBalanceError,
  NotFoundError,
} from '../../shared/errors';

const COOLDOWN_MS = env.WITHDRAWAL_COOLDOWN_HOURS * 60 * 60 * 1000;

export const withdrawalsService = {
  /**
   * Creates an on-demand withdrawal for the creator's full available
   * balance. Enforces, in order: a verified payout method exists, the
   * balance clears the platform minimum, and the cooldown since the
   * creator's last withdrawal has elapsed. The balance is debited
   * optimistically at creation time (not when the worker later succeeds)
   * so a creator cannot double-withdraw by firing two requests before the
   * first one finishes — see schema comment on withdrawals.amount.
   */
  async requestOnDemandWithdrawal(creatorId: string): Promise<Withdrawal> {
    const creator = await creatorsRepository.findById(creatorId);
    if (!creator) {
      throw new NotFoundError('Creator not found');
    }

    this.assertCooldownElapsed(creator);

    const minimumAmount = fromMinorUnits(env.WITHDRAWAL_MIN_AMOUNT_MINOR, creator.payoutCurrency);
    if (!isAmountGte(creator.availableBalance, minimumAmount)) {
      throw new BelowMinimumWithdrawalError(minimumAmount);
    }

    const payoutMethod = await payoutMethodsService.getVerifiedMethodOrThrow(creatorId);
    const poolAccount = await poolAccountsService.getByCurrencyOrThrow(creator.payoutCurrency);

    const withdrawal = await this.createAndQueue({
      creator,
      payoutMethodId: payoutMethod.id,
      poolAccountId: poolAccount.id,
      amount: creator.availableBalance,
      trigger: 'ON_DEMAND',
    });

    return withdrawal;
  },

  /**
   * Runs the scheduled sweep: every creator who is payout-eligible (has a
   * VERIFIED payout method) and has a positive balance gets a withdrawal
   * created and queued for their full balance. Called by the cron defined
   * in infra/queue/scheduler.ts on the configured cadence. Does NOT apply
   * the cooldown or minimum-amount checks — those exist specifically to
   * stop a creator hammering the on-demand endpoint; the scheduled sweep is
   * the platform's own cadence and is allowed to pay out any positive
   * balance, however small.
   */
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
        // One creator's missing pool account or revoked method must never
        // abort the sweep for everyone else — log and continue.
        logger.error({ err, creatorId: creator.id }, 'Scheduled sweep failed for creator, skipping');
        skipped += 1;
      }
    }

    logger.info({ queued, skipped }, 'Scheduled disbursement sweep complete');
    return { queued, skipped };
  },

  /** Shared by both trigger paths: create the row, debit the balance, queue the job. */
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
