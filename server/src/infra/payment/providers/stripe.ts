import Stripe from 'stripe';
import { stripeClient } from '../../stripe/stripe-client';
import { env } from '../../../config/env';
import { ValidationError } from '../../../shared/errors';
import { logger } from '../../../config/logger';
import type {
  PaymentProvider,
  CreateCheckoutSessionParams,
  CheckoutSessionResponse,
  PaymentWebhookEvent,
} from '../types';

function getStripeEvent(event: PaymentWebhookEvent): Stripe.Event {
  return event.raw as Stripe.Event;
}

export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const;

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: params.metadata.productName ?? 'Product' },
            unit_amount: Math.round(Number.parseFloat(params.amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });

    if (!session.id || !session.url) {
      throw new Error('Failed to create Stripe Checkout session');
    }

    return { sessionId: session.id, sessionUrl: session.url, provider: this.name };
  }

  constructEvent(rawBody: Buffer | string, signature: string): PaymentWebhookEvent {
    const body = typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody;
    const secret = env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed');
      throw new ValidationError('Invalid webhook signature');
    }
    return { type: event.type, raw: event };
  }

  getTransactionId(event: PaymentWebhookEvent): string | null {
    const stripeEvent = getStripeEvent(event);
    if (stripeEvent.type === 'payment_intent.succeeded') {
      return (stripeEvent.data.object as Stripe.PaymentIntent).id;
    }
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      if (typeof session.payment_intent === 'string') return session.payment_intent;
      return session.payment_intent?.id ?? session.id;
    }
    if (stripeEvent.type === 'charge.refunded') {
      const charge = stripeEvent.data.object as Stripe.Charge;
      return typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id ?? null;
    }
    return null;
  }

  getPaymentStatus(event: PaymentWebhookEvent): 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | null {
    const stripeEvent = getStripeEvent(event);
    if (stripeEvent.type === 'payment_intent.succeeded') return 'PAID';
    if (stripeEvent.type === 'checkout.session.completed') return 'PAID';
    if (stripeEvent.type === 'charge.refunded') return 'REFUNDED';
    if (stripeEvent.type === 'payment_intent.payment_failed') return 'FAILED';
    return null;
  }

  getAmount(event: PaymentWebhookEvent): string | null {
    const stripeEvent = getStripeEvent(event);
    const object = stripeEvent.data.object as { amount?: number; amount_total?: number };
    if (object.amount !== undefined) return (object.amount / 100).toFixed(2);
    if (object.amount_total !== undefined) return (object.amount_total / 100).toFixed(2);
    return null;
  }

  getCurrency(event: PaymentWebhookEvent): string | null {
    const stripeEvent = getStripeEvent(event);
    const object = stripeEvent.data.object as { currency?: string };
    return object.currency ? object.currency.toUpperCase() : null;
  }

  getCustomerEmail(event: PaymentWebhookEvent): string | null {
    const stripeEvent = getStripeEvent(event);
    if (stripeEvent.type === 'checkout.session.completed') {
      return (stripeEvent.data.object as Stripe.Checkout.Session).customer_email ?? null;
    }
    return null;
  }

  getMetadata(event: PaymentWebhookEvent): Record<string, string> {
    const stripeEvent = getStripeEvent(event);
    const metadata = (stripeEvent.data.object as { metadata?: Record<string, string> }).metadata;
    return metadata ?? {};
  }

  isCheckoutCompletedEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'checkout.session.completed';
  }

  isPaymentIntentEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'payment_intent.succeeded';
  }

  isRefundEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'charge.refunded';
  }
}
