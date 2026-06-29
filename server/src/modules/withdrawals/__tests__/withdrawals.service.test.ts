import { describe, it, expect } from 'vitest';
import type { Creator } from '../../creators/creators.repository';

// WITHDRAWAL_COOLDOWN_HOURS must be set before withdrawals.service.ts is
// imported, since it reads env.WITHDRAWAL_COOLDOWN_HOURS at module load
// time to compute COOLDOWN_MS. Setting test env vars here, before any
// import of the module under test, is required for this to work correctly.
process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/db';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.BETTER_AUTH_SECRET ??= 'a-very-long-random-secret-string-for-testing-purposes';
process.env.BETTER_AUTH_URL ??= 'http://localhost:4000';
process.env.STRIPE_SECRET_KEY ??= 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_fake';
process.env.AFRIEX_API_KEY ??= 'fake_key';
process.env.AFRIEX_WEBHOOK_PUBLIC_KEY ??= 'fake_webhook_key';
process.env.PAYOUT_SECRETS_ENCRYPTION_KEY ??= 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
process.env.RESEND_API_KEY ??= 're_fake';
process.env.RESEND_FROM_EMAIL ??= 'test@example.com';
process.env.WITHDRAWAL_COOLDOWN_HOURS = '24';

const { withdrawalsService } = await import('../withdrawals.service');

function makeCreator(overrides: Partial<Creator> = {}): Creator {
  return {
    id: 'creator-1',
    userId: 'user-1',
    availableBalance: '100.00',
    payoutCurrency: 'USD',
    payoutEligible: true,
    lastWithdrawalAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Creator;
}

describe('withdrawalsService.assertCooldownElapsed', () => {
  it('allows withdrawal when the creator has never withdrawn before', () => {
    const creator = makeCreator({ lastWithdrawalAt: null });
    expect(() => withdrawalsService.assertCooldownElapsed(creator)).not.toThrow();
  });

  it('blocks withdrawal when the last withdrawal was within the cooldown window', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const creator = makeCreator({ lastWithdrawalAt: oneHourAgo });
    expect(() => withdrawalsService.assertCooldownElapsed(creator)).toThrow(/cooldown/i);
  });

  it('allows withdrawal once the cooldown window has fully elapsed', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const creator = makeCreator({ lastWithdrawalAt: twentyFiveHoursAgo });
    expect(() => withdrawalsService.assertCooldownElapsed(creator)).not.toThrow();
  });

  it('blocks at exactly the boundary minus one second', () => {
    const justUnder24h = new Date(Date.now() - (24 * 60 * 60 * 1000 - 1000));
    const creator = makeCreator({ lastWithdrawalAt: justUnder24h });
    expect(() => withdrawalsService.assertCooldownElapsed(creator)).toThrow(/cooldown/i);
  });
});
