import { describe, it, expect } from 'vitest';
import { CreateCheckoutSessionSchema } from '../orders.schema';

describe('CreateCheckoutSessionSchema', () => {
  const base = {
    productId: '550e8400-e29b-41d4-a716-446655440000',
    customerEmail: 'buyer@example.com',
    customerName: 'Ada Lovelace',
    successUrl: 'https://app.example.com/success',
    cancelUrl: 'https://app.example.com/cancel',
  };

  it('accepts checkout without paymentProvider (optional)', () => {
    const result = CreateCheckoutSessionSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('accepts paystack, flutterwave, and afriex-checkout as paymentProvider', () => {
    expect(CreateCheckoutSessionSchema.safeParse({ ...base, paymentProvider: 'paystack' }).success).toBe(true);
    expect(CreateCheckoutSessionSchema.safeParse({ ...base, paymentProvider: 'flutterwave' }).success).toBe(true);
    expect(CreateCheckoutSessionSchema.safeParse({ ...base, paymentProvider: 'afriex-checkout' }).success).toBe(true);
  });

  it('accepts stripe as optional legacy collector', () => {
    expect(CreateCheckoutSessionSchema.safeParse({ ...base, paymentProvider: 'stripe' }).success).toBe(true);
  });

  it('rejects unknown collectors', () => {
    const result = CreateCheckoutSessionSchema.safeParse({
      ...base,
      paymentProvider: 'paypal',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email and product id', () => {
    expect(
      CreateCheckoutSessionSchema.safeParse({ ...base, customerEmail: 'not-an-email' }).success,
    ).toBe(false);
    expect(
      CreateCheckoutSessionSchema.safeParse({ ...base, productId: 'not-uuid' }).success,
    ).toBe(false);
  });
});
