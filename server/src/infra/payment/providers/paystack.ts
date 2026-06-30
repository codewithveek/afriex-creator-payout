import crypto from 'node:crypto';
import { env } from '../../../config/env';
import { ValidationError } from '../../../shared/errors';
import { logger } from '../../../config/logger';
import type {
  PaymentProvider,
  CreateCheckoutSessionParams,
  CheckoutSessionResponse,
  PaymentWebhookEvent,
} from '../types';

interface PaystackApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackWebhookData {
  reference: string;
  amount: number;
  currency: string;
  customer: { email: string };
  metadata: Record<string, string>;
  status: string;
}

interface PaystackWebhookPayload {
  event: string;
  data: PaystackWebhookData;
}

export class PaystackProvider implements PaymentProvider {
  readonly name = 'paystack' as const;
  private readonly baseUrl = 'https://api.paystack.co';

  private async request<T>(path: string, body: unknown): Promise<PaystackApiResponse<T>> {
    const secretKey = env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not set');
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as PaystackApiResponse<T>;
    if (!res.ok || json.status === false) {
      throw new Error(`Paystack API error: ${json.message ?? JSON.stringify(json)}`);
    }
    return json;
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
    const amountInKobo = Math.round(Number.parseFloat(params.amount) * 100);

    const response = await this.request<PaystackInitData>('/transaction/initialize', {
      email: params.customerEmail,
      amount: amountInKobo,
      currency: params.currency,
      callback_url: params.successUrl,
      metadata: params.metadata,
    });

    return {
      sessionId: response.data.reference,
      sessionUrl: response.data.authorization_url,
      provider: this.name,
    };
  }

  constructEvent(rawBody: Buffer | string, signature: string): PaymentWebhookEvent {
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const secret = env.PAYSTACK_WEBHOOK_SECRET;
    if (!secret) throw new Error('PAYSTACK_WEBHOOK_SECRET is not set');

    const expectedHash = crypto.createHmac('sha512', secret).update(body).digest('hex');

    if (signature !== expectedHash) {
      logger.warn('Paystack webhook signature verification failed');
      throw new ValidationError('Invalid webhook signature');
    }

    const payload = JSON.parse(body) as PaystackWebhookPayload;
    return { type: payload.event, raw: payload };
  }

  getTransactionId(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as PaystackWebhookPayload;
    return payload.data?.reference ?? null;
  }

  getPaymentStatus(event: PaymentWebhookEvent): 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | null {
    const payload = event.raw as PaystackWebhookPayload;
    if (event.type === 'charge.success' && payload.data?.status === 'success') return 'PAID';
    if (event.type === 'charge.success' && payload.data?.status !== 'success') return 'PENDING';
    if (event.type === 'charge.failed') return 'FAILED';
    if (event.type === 'refund.processed') return 'REFUNDED';
    return null;
  }

  getAmount(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as PaystackWebhookPayload;
    if (!payload.data?.amount) return null;
    return (payload.data.amount / 100).toFixed(2);
  }

  getCurrency(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as PaystackWebhookPayload;
    return payload.data?.currency?.toUpperCase() ?? null;
  }

  getCustomerEmail(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as PaystackWebhookPayload;
    return payload.data?.customer?.email ?? null;
  }

  getMetadata(event: PaymentWebhookEvent): Record<string, string> {
    const payload = event.raw as PaystackWebhookPayload;
    return payload.data?.metadata ?? {};
  }

  isCheckoutCompletedEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'charge.success';
  }

  isPaymentIntentEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'charge.success';
  }

  isRefundEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'refund.processed';
  }
}
