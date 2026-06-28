import { salesRepository, type Sale } from './sales.repository';
import { earningsService } from '../earnings/earnings.service';
import { creatorsService } from '../creators/creators.service';
import { logger } from '../../config/logger';

interface ConfirmedPaymentEvent {
  stripePaymentIntentId: string;
  creatorUserId: string; // identifies which creator made the sale, passed via Stripe metadata
  grossAmount: string;
  currency: 'USD' | 'NGN' | 'GHS' | 'KES';
}

export const salesService = {
  /**
   * Handles a confirmed Stripe payment. Creates the sale row (guarded by
   * the DB's unique constraint on stripePaymentIntentId, so a redelivered
   * webhook is always safe to replay), then immediately hands off to
   * EarningsService to credit the creator. If a sale already exists for
   * this payment intent, this is a no-op replay and returns the existing
   * sale without reprocessing earnings.
   */
  async recordConfirmedPayment(event: ConfirmedPaymentEvent): Promise<Sale> {
    const existing = await salesRepository.findByStripePaymentIntentId(event.stripePaymentIntentId);
    if (existing) {
      logger.info(
        { stripePaymentIntentId: event.stripePaymentIntentId },
        'Webhook replay detected, sale already recorded',
      );
      return existing;
    }

    const creator = await creatorsService.getByUserId(event.creatorUserId);

    const sale = await salesRepository.create({
      creatorId: creator.id,
      stripePaymentIntentId: event.stripePaymentIntentId,
      grossAmount: event.grossAmount,
      currency: event.currency,
      status: 'PAID',
    });

    await earningsService.processSale(sale);

    return sale;
  },

  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Sale | undefined> {
    return salesRepository.findByStripePaymentIntentId(stripePaymentIntentId);
  },
};
