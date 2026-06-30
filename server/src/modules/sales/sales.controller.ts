import type { FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import { salesService } from './sales.service';
import { salesRepository } from './sales.repository';
import { earningsService } from '../earnings/earnings.service';
import { creatorsService } from '../creators/creators.service';
import { stripeClient } from '../../infra/stripe/stripe-client';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ValidationError } from '../../shared/errors';
import { ordersService } from '../orders/orders.service';

export const salesController = {
  /**
   * Stripe webhook entry point. Verifies the signature against the RAW
   * request body (the router must register this route with a raw-body
   * content-type parser — see sales.router.ts) before trusting anything in
   * the payload. This is the only place Stripe's signing secret is used.
   */
  async handleStripeWebhook(
    request: FastifyRequest<{ Body: Buffer }>,
    reply: FastifyReply,
  ) {
    const signature = request.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      throw new ValidationError('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(request.body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed');
      throw new ValidationError('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const creatorUserId = intent.metadata.creatorUserId;
        if (!creatorUserId) {
          logger.error({ paymentIntentId: intent.id }, 'payment_intent missing creatorUserId metadata');
          break;
        }

        await salesService.recordConfirmedPayment({
          stripePaymentIntentId: intent.id,
          creatorUserId,
          grossAmount: (intent.amount / 100).toFixed(2),
          currency: intent.currency.toUpperCase() as 'USD' | 'NGN' | 'GHS' | 'KES',
        });
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;
        if (metadata?.productId && metadata?.creatorId) {
          await ordersService.completeOrder(session.id);

          const creator = await creatorsService.getById(metadata.creatorId);
          if (creator) {
            await salesService.recordConfirmedPayment({
              stripePaymentIntentId:
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent?.id || session.id,
              creatorUserId: creator.userId,
              grossAmount: ((session.amount_total ?? 0) / 100).toFixed(2),
              currency: session.currency?.toUpperCase() as 'USD' | 'NGN' | 'GHS' | 'KES',
            });
          }

          logger.info({ sessionId: session.id, productId: metadata.productId }, 'Checkout completed');
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;

        if (paymentIntentId) {
          const sale = await salesService.findByStripePaymentIntentId(paymentIntentId);
          if (sale) {
            await earningsService.reverseForRefund(sale.id);
          } else {
            logger.warn({ paymentIntentId }, 'Refund webhook received for unknown sale');
          }
        }
        break;
      }

      default:
        logger.debug({ eventType: event.type }, 'Unhandled Stripe webhook event type');
    }

    return reply.code(200).send({ data: { received: true } });
  },

  async listMySales(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const sales = await salesRepository.findByCreatorId(creator.id);
    return reply.code(200).send({ data: sales });
  },
};
