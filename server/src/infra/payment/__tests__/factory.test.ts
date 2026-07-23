import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    PAYSTACK_SECRET_KEY: 'sk_test_paystack',
    FLUTTERWAVE_SECRET_KEY: 'FLWSECK_TEST',
    STRIPE_SECRET_KEY: 'sk_test_stripe',
    STRIPE_WEBHOOK_SECRET: 'whsec_test',
    AFRIEX_API_KEY: 'afriex-key',
    PAYMENT_PROVIDER: 'paystack',
  },
}));

vi.mock('../../../config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../stripe/stripe-client', () => ({
  stripeClient: {
    webhooks: { constructEvent: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
}));

vi.mock('../../afriex/afriex-client', () => ({
  afriexClient: {
    createCheckoutSession: vi.fn(),
  },
}));

const {
  listAvailableCollectors,
  resolveCheckoutProvider,
  SELECTABLE_COLLECTORS,
} = await import('../factory');

describe('payment factory', () => {
  it('exposes Paystack, Flutterwave, and Afriex Checkout as selectable collectors', () => {
    expect(SELECTABLE_COLLECTORS).toEqual(['paystack', 'flutterwave', 'afriex-checkout']);
  });

  it('lists available collectors including Afriex Checkout', () => {
    const collectors = listAvailableCollectors();
    expect(collectors.length).toBeGreaterThanOrEqual(1);
    const ids = collectors.map((c) => c.id);
    expect(ids).toContain('paystack');
    expect(ids).toContain('flutterwave');
    expect(ids).toContain('afriex-checkout');

    const afriex = collectors.find((c) => c.id === 'afriex-checkout');
    expect(afriex?.primary).toBe(false);
    expect(collectors.filter((c) => c.primary).map((c) => c.id)).toEqual(
      expect.arrayContaining(['paystack', 'flutterwave']),
    );
  });

  it('resolves buyer-requested paystack when available', () => {
    expect(resolveCheckoutProvider('paystack')).toBe('paystack');
  });

  it('resolves buyer-requested flutterwave when available', () => {
    expect(resolveCheckoutProvider('flutterwave')).toBe('flutterwave');
  });

  it('resolves buyer-requested afriex-checkout when available', () => {
    expect(resolveCheckoutProvider('afriex-checkout')).toBe('afriex-checkout');
  });

  it('defaults to first available selectable collector when none requested', () => {
    expect(resolveCheckoutProvider(undefined)).toBe('paystack');
    expect(resolveCheckoutProvider(null)).toBe('paystack');
  });
});
