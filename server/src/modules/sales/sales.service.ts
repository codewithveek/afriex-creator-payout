import { salesRepository, type Sale } from './sales.repository';
import { earningsService } from '../earnings/earnings.service';
import { creatorsService } from '../creators/creators.service';
import { logger } from '../../config/logger';

interface ConfirmedPaymentEvent {
  paymentIntentId: string;
  creatorUserId: string;
  grossAmount: string;
  currency: 'USD' | 'NGN' | 'GHS' | 'KES';
}

export const salesService = {
  /**
   * Handles a confirmed payment from any provider. Creates the sale row
   * (guarded by the DB's unique constraint on paymentIntentId, so a
   * redelivered webhook is always safe to replay), then immediately hands
   * off to EarningsService to credit the creator. If a sale already exists
   * for this payment intent, this is a no-op replay and returns the
   * existing sale without reprocessing earnings.
   */
  async recordConfirmedPayment(event: ConfirmedPaymentEvent): Promise<Sale> {
    const existing = await salesRepository.findByPaymentIntentId(event.paymentIntentId);
    if (existing) {
      logger.info(
        { paymentIntentId: event.paymentIntentId },
        'Webhook replay detected, sale already recorded',
      );
      return existing;
    }

    const creator = await creatorsService.getByUserId(event.creatorUserId);

    const sale = await salesRepository.create({
      creatorId: creator.id,
      paymentIntentId: event.paymentIntentId,
      grossAmount: event.grossAmount,
      currency: event.currency,
      status: 'PAID',
    });

    await earningsService.processSale(sale);

    return sale;
  },

  async findByPaymentIntentId(paymentIntentId: string): Promise<Sale | undefined> {
    return salesRepository.findByPaymentIntentId(paymentIntentId);
  },
};
