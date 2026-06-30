import type { FastifyRequest, FastifyReply } from 'fastify';
import { getPaymentProvider } from '../../infra/payment/factory';
import { salesService } from './sales.service';
import { salesRepository } from './sales.repository';
import { earningsService } from '../earnings/earnings.service';
import { creatorsService } from '../creators/creators.service';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ValidationError } from '../../shared/errors';
import { ordersService } from '../orders/orders.service';
import type { PaymentProviderName } from '../../infra/payment/types';

export const salesController = {
  /**
   * Generic payment webhook entry point. Determines which provider the
   * request came from via header inspection, then delegates to the
   * corresponding PaymentProvider adapter for signature verification
   * and event parsing. The router must register this route with a raw-body
   * content-type parser (see sales.router.ts).
   */
  async handlePaymentWebhook(
    request: FastifyRequest<{ Body: Buffer }>,
    reply: FastifyReply,
  ) {
    const providerName = detectProviderFromRequest(request);
    const provider = getPaymentProvider(providerName);

    const signatureHeader = getProviderSignatureHeader(request, providerName);
    const event = provider.constructEvent(request.body, signatureHeader);

    if (provider.isPaymentIntentEvent(event)) {
      const transactionId = provider.getTransactionId(event);
      const creatorUserId = provider.getMetadata(event).creatorUserId;
      if (!creatorUserId || !transactionId) {
        logger.error({ transactionId }, 'payment intent missing creatorUserId metadata');
        return reply.code(200).send({ data: { received: true } });
      }

      const amount = provider.getAmount(event);
      const currency = provider.getCurrency(event);
      if (!amount || !currency) {
        logger.error({ transactionId }, 'payment intent missing amount or currency');
        return reply.code(200).send({ data: { received: true } });
      }

      await salesService.recordConfirmedPayment({
        paymentIntentId: transactionId,
        creatorUserId,
        grossAmount: amount,
        currency: currency as 'USD' | 'NGN' | 'GHS' | 'KES',
      });
    }

    if (provider.isCheckoutCompletedEvent(event)) {
      const metadata = provider.getMetadata(event);
      if (metadata.productId && metadata.creatorId) {
        const sessionId = provider.getTransactionId(event);
        if (sessionId) {
          await ordersService.completeOrder(sessionId);
        }

        const creator = await creatorsService.getById(metadata.creatorId);
        if (creator) {
          const amount = provider.getAmount(event);
          const currency = provider.getCurrency(event);
          if (amount && currency) {
            const transactionId = provider.getTransactionId(event);
            await salesService.recordConfirmedPayment({
              paymentIntentId: transactionId ?? sessionId ?? 'unknown',
              creatorUserId: creator.userId,
              grossAmount: amount,
              currency: currency as 'USD' | 'NGN' | 'GHS' | 'KES',
            });
          }
        }

        logger.info({ sessionId: metadata.productId, productId: metadata.productId }, 'Checkout completed');
      }
    }

    if (provider.isRefundEvent(event)) {
      const transactionId = provider.getTransactionId(event);
      if (transactionId) {
        const sale = await salesService.findByPaymentIntentId(transactionId);
        if (sale) {
          await earningsService.reverseForRefund(sale.id);
        } else {
          logger.warn({ transactionId }, 'Refund webhook received for unknown sale');
        }
      }
    }

    return reply.code(200).send({ data: { received: true } });
  },

  async listMySales(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const sales = await salesRepository.findByCreatorId(creator.id);
    return reply.code(200).send({ data: sales });
  },
};

function detectProviderFromRequest(request: FastifyRequest<{ Body: Buffer }>): PaymentProviderName {
  const configured = env.PAYMENT_PROVIDER as PaymentProviderName;
  return configured;
}

function getProviderSignatureHeader(
  request: FastifyRequest<{ Body: Buffer }>,
  providerName: PaymentProviderName,
): string {
  if (providerName === 'stripe') {
    const sig = request.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') throw new ValidationError('Missing stripe-signature header');
    return sig;
  }
  if (providerName === 'paystack') {
    const sig = request.headers['x-paystack-signature'];
    if (!sig || typeof sig !== 'string') throw new ValidationError('Missing x-paystack-signature header');
    return sig;
  }
  if (providerName === 'flutterwave') {
    const sig = request.headers['verif-hash'];
    if (!sig || typeof sig !== 'string') throw new ValidationError('Missing verif-hash header');
    return sig;
  }
  if (providerName === 'afriex-checkout') {
    const sig = request.headers['x-afriex-signature'];
    if (!sig || typeof sig !== 'string') throw new ValidationError('Missing x-afriex-signature header');
    return sig;
  }
  throw new ValidationError(`Unknown payment provider: ${providerName}`);
}
