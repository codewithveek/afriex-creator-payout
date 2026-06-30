import { earningsRepository, type Earning } from './earnings.repository';
import { salesRepository, type Sale } from '../sales/sales.repository';
import { creatorsRepository } from '../creators/creators.repository';
import { poolAccountsService } from '../pool-accounts/pool-accounts.service';
import { computeFee } from '../../shared/utils/fees';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { DuplicateSaleError } from '../../shared/errors';

export const earningsService = {
  /**
   * Processes a PAID sale into a confirmed earning. This is the single
   * pivot point of the entire pipeline: Sale -> Earning -> creator balance
   * + pool account balance. Called from the payment webhook handler once a
   * sale's status has been confirmed PAID.
   *
   * Idempotency: the DB's unique constraint on earnings.saleId is the real
   * guard (see schema comment), not this status check — the check here is
   * just a fast-path that avoids an unnecessary DB round-trip on a retried
   * webhook. No Afriex call happens here at all, by design: earnings only
   * accrue a balance, they never trigger disbursement directly. That
   * separation is what makes weekly/biweekly/on-demand withdrawal possible
   * against the same balance.
   */
  async processSale(sale: Sale): Promise<Earning> {
    const existing = await earningsRepository.findBySaleId(sale.id);
    if (existing) {
      throw new DuplicateSaleError(sale.paymentIntentId);
    }

    const fee = computeFee(sale.grossAmount, env.PLATFORM_FEE_PERCENT);

    const earning = await earningsRepository.create({
      creatorId: sale.creatorId,
      saleId: sale.id,
      grossAmount: fee.grossAmount,
      platformFeePercent: fee.platformFeePercent,
      platformFeeAmount: fee.platformFeeAmount,
      amount: fee.netAmount,
      currency: sale.currency,
      status: 'CONFIRMED',
    });

    // Credit the creator's running balance with the net amount...
    await creatorsRepository.incrementBalance(sale.creatorId, fee.netAmount);

    // ...and settle the GROSS amount into the currency's pool account. The
    // pool account holds what was actually collected from the buyer; the
    // platform fee portion simply remains there as platform revenue rather
    // than being disbursed, while the net portion is what eventually flows
    // out to the creator on withdrawal.
    const poolAccount = await poolAccountsService.getByCurrencyOrThrow(sale.currency);
    await poolAccountsService.settleSaleIntoPool(poolAccount.id, fee.grossAmount);

    logger.info(
      { saleId: sale.id, creatorId: sale.creatorId, netAmount: fee.netAmount },
      'Sale processed into earning',
    );

    return earning;
  },

  /**
   * Reverses an earning when its underlying sale is refunded. Debits the
   * creator's balance back and the pool account back by the same amounts
   * that were credited at processing time — never recomputed, always the
   * frozen historical values on the earning row itself.
   */
  async reverseForRefund(saleId: string): Promise<void> {
    const earning = await earningsRepository.findBySaleId(saleId);
    if (!earning || earning.status === 'REVERSED') return;

    await earningsRepository.markReversed(earning.id);
    await creatorsRepository.decrementBalance(earning.creatorId, earning.amount);

    const poolAccount = await poolAccountsService.getByCurrencyOrThrow(earning.currency);
    await poolAccountsService.debitForWithdrawal(poolAccount.id, earning.grossAmount);

    await salesRepository.markRefunded(saleId);

    logger.info({ saleId, earningId: earning.id }, 'Earning reversed due to sale refund');
  },

  async listForCreator(creatorId: string): Promise<Earning[]> {
    return earningsRepository.findByCreatorId(creatorId);
  },
};
