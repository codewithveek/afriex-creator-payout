export interface CreateCheckoutSessionParams {
  amount: string;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  sessionUrl: string;
  provider: string;
}

export interface PaymentWebhookEvent {
  type: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse>;
  constructEvent(rawBody: Buffer | string, signature: string): PaymentWebhookEvent;
  getTransactionId(event: PaymentWebhookEvent): string | null;
  getPaymentStatus(event: PaymentWebhookEvent): 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | null;
  getAmount(event: PaymentWebhookEvent): string | null;
  getCurrency(event: PaymentWebhookEvent): string | null;
  getCustomerEmail(event: PaymentWebhookEvent): string | null;
  getMetadata(event: PaymentWebhookEvent): Record<string, string>;
  isCheckoutCompletedEvent(event: PaymentWebhookEvent): boolean;
  isPaymentIntentEvent(event: PaymentWebhookEvent): boolean;
  isRefundEvent(event: PaymentWebhookEvent): boolean;
}

export type PaymentProviderName = 'stripe' | 'paystack' | 'flutterwave' | 'afriex-checkout';
