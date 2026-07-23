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

interface FlutterwaveApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

interface FlutterwaveInitData {
  link: string;
  id: number;
  tx_ref: string;
}

interface FlutterwaveWebhookData {
  id: number;
  tx_ref: string;
  flw_ref: string;
  amount: number;
  currency: string;
  charged_amount: number;
  status: 'successful' | 'failed' | 'pending' | 'cancelled';
  customer: { email: string };
  meta: Record<string, string>;
}

interface FlutterwaveWebhookPayload {
  event: string;
  'event.type'?: string;
  data: FlutterwaveWebhookData;
}

export class FlutterwaveProvider implements PaymentProvider {
  readonly name = 'flutterwave' as const;
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  private async request<T>(path: string, body: unknown): Promise<FlutterwaveApiResponse<T>> {
    const secretKey = env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) throw new Error('FLUTTERWAVE_SECRET_KEY is not set');
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as FlutterwaveApiResponse<T>;
    if (json.status !== 'success') {
      throw new Error(`Flutterwave API error: ${json.message ?? JSON.stringify(json)}`);
    }
    return json;
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
    const txRef = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const response = await this.request<FlutterwaveInitData>('/payments', {
      tx_ref: txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.successUrl,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      meta: params.metadata,
      customizations: {
        title: params.metadata.productName ?? 'Payment',
      },
    });

    return {
      // Use tx_ref so webhook + redirect query params match orders.paymentSessionId
      sessionId: response.data.tx_ref || txRef,
      sessionUrl: response.data.link,
      provider: this.name,
    };
  }

  constructEvent(rawBody: Buffer | string, signature: string): PaymentWebhookEvent {
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const secret = env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (secret) {
      const expectedHash = crypto.createHmac('sha256', secret).update(body).digest('hex');
      if (signature !== `sha256=${expectedHash}` && signature !== expectedHash) {
        logger.warn('Flutterwave webhook signature verification failed');
        throw new ValidationError('Invalid webhook signature');
      }
    }

    const payload = JSON.parse(body) as FlutterwaveWebhookPayload;
    const eventType = payload['event.type'] ?? payload.event;
    return { type: eventType, raw: payload };
  }

  getTransactionId(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as FlutterwaveWebhookPayload;
    return payload.data?.tx_ref ?? String(payload.data?.id ?? '');
  }

  getPaymentStatus(event: PaymentWebhookEvent): 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | null {
    const payload = event.raw as FlutterwaveWebhookPayload;
    if (event.type === 'charge.completed' && payload.data?.status === 'successful') return 'PAID';
    if (event.type === 'charge.completed' && payload.data?.status === 'pending') return 'PENDING';
    if (event.type === 'charge.completed' && payload.data?.status === 'failed') return 'FAILED';
    if (event.type === 'refund.completed') return 'REFUNDED';
    return null;
  }

  getAmount(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as FlutterwaveWebhookPayload;
    if (!payload.data?.amount) return null;
    return payload.data.amount.toFixed(2);
  }

  getCurrency(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as FlutterwaveWebhookPayload;
    return payload.data?.currency?.toUpperCase() ?? null;
  }

  getCustomerEmail(event: PaymentWebhookEvent): string | null {
    const payload = event.raw as FlutterwaveWebhookPayload;
    return payload.data?.customer?.email ?? null;
  }

  getMetadata(event: PaymentWebhookEvent): Record<string, string> {
    const payload = event.raw as FlutterwaveWebhookPayload;
    return payload.data?.meta ?? {};
  }

  isCheckoutCompletedEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'charge.completed';
  }

  isPaymentIntentEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'charge.completed';
  }

  isRefundEvent(event: PaymentWebhookEvent): boolean {
    return event.type === 'refund.completed';
  }
}
