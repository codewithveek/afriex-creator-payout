import crypto from 'node:crypto';
import { WebhookVerifier, WEBHOOK_SIGNATURE_HEADER } from '@afriex/sdk';
import { env } from '../../../config/env';
import { ValidationError } from '../../../shared/errors';
import { logger } from '../../../config/logger';
import type {
  PaymentProvider,
  CreateCheckoutSessionParams,
  CheckoutSessionResponse,
  PaymentWebhookEvent,
} from '../types';

interface AfriexCheckoutResponse {
  data: {
    checkoutUrl: string;
  };
}

interface AfriexWebhookPayload {
  event: string;
  data: {
    merchantReference: string;
    status: string;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata: Record<string, string>;
  };
}

export class AfriexCheckoutProvider implements PaymentProvider {
  readonly name = 'afriex-checkout' as const;
  private readonly baseUrl =
    env.AFRIEX_ENVIRONMENT === 'staging' ? 'https://sandbox.api.afriex.com' : 'https://api.afriex.com';

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
    const merchantReference = `co-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const res = await fetch(`${this.baseUrl}/api/v1/checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.AFRIEX_API_KEY,
      },
      body: JSON.stringify({
        amount: Math.round(Number.parseFloat(params.amount) * 100),
        currency: params.currency,
        merchantReference,
        redirectUrl: params.successUrl,
        customer: {
          phone: params.customerPhone ?? params.metadata.customerPhone ?? '+2340000000000',
          name: params.customerName,
          email: params.customerEmail,
          countryCode: params.metadata.countryCode ?? 'NG',
        },
        channels: ['CARD', 'VIRTUAL_BANK_ACCOUNT', 'MOBILE_MONEY'],
        metadata: params.metadata,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Afriex Checkout API error: ${err}`);
    }

    const json = (await res.json()) as AfriexCheckoutResponse;

    return {
      sessionId: merchantReference,
      sessionUrl: json.data.checkoutUrl,
      provider: this.name,
    };
  }

  constructEvent(rawBody: Buffer | string, signature: string): PaymentWebhookEvent {
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    const verifier = new WebhookVerifier(env.AFRIEX_WEBHOOK_PUBLIC_KEY);
    if (!verifier.verify(body, signature)) {
      logger.warn('Afriex webhook signature verification failed');
      throw new ValidationError('Invalid webhook signature');
    }

    const payload = JSON.parse(body) as AfriexWebhookPayload;
    return { type: payload.event, raw: payload };
  }

  getTransactionId(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as AfriexWebhookPayload;
    return payload.data?.merchantReference ?? null;
  }

  getPaymentStatus(event: PaymentWebhookEvent): 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | null {
    const payload = event.raw as AfriexWebhookPayload;
    if (event.type === 'CHECKOUT_SESSION.CREATED' && payload.data?.status === 'COMPLETED') return 'PAID';
    if (event.type === 'CHECKOUT_SESSION.CREATED' && payload.data?.status === 'FAILED') return 'FAILED';
    if (event.type === 'CHECKOUT_SESSION.CREATED' && payload.data?.status === 'PENDING') return 'PENDING';
    return null;
  }

  getAmount(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as AfriexWebhookPayload;
    if (!payload.data?.amount) return null;
    return (payload.data.amount / 100).toFixed(2);
  }

  getCurrency(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as AfriexWebhookPayload;
    return payload.data?.currency?.toUpperCase() ?? null;
  }

  getCustomerEmail(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as AfriexWebhookPayload;
    return payload.data?.customer?.email ?? null;
  }

  getMetadata(event: PaymentWebhookEvent): Record<string, string> {
    const payload = event.raw as AfriexWebhookPayload;
    return payload.data?.metadata ?? {};
  }

  isCheckoutCompletedEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'CHECKOUT_SESSION.CREATED';
  }

  isPaymentIntentEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'CHECKOUT_SESSION.CREATED';
  }

  isRefundEvent(_event: PaymentWebhookEvent): boolean {
    return false;
  }
}
