import { describe, it, expect } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/db';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.BETTER_AUTH_SECRET ??= 'a-very-long-random-secret-string-for-testing-purposes';
process.env.BETTER_AUTH_URL ??= 'http://localhost:4000';
process.env.FRONTEND_URL ??= 'http://localhost:3000';
process.env.R2_PUBLIC_URL ??= 'https://files.example-cdn.com';
process.env.AFRIEX_API_KEY ??= 'fake_key';
process.env.AFRIEX_WEBHOOK_PUBLIC_KEY ??= 'fake_webhook_key';
process.env.PAYOUT_SECRETS_ENCRYPTION_KEY ??= 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
process.env.RESEND_API_KEY ??= 're_fake';
process.env.RESEND_FROM_EMAIL ??= 'test@example.com';
process.env.NODE_ENV = 'development';

const {
  assertSafeAppRedirectUrl,
  assertSafeStorageRedirectUrl,
  getAllowedRedirectOrigins,
} = await import('../safe-redirect');
const { ValidationError } = await import('../../errors');

describe('safe-redirect', () => {
  it('allows FRONTEND_URL origin paths', () => {
    const url = assertSafeAppRedirectUrl('http://localhost:3000/purchase/success?x=1', 'successUrl');
    expect(url).toContain('localhost:3000');
  });

  it('rejects external origins (open redirect)', () => {
    expect(() =>
      assertSafeAppRedirectUrl('https://evil.example/phish', 'successUrl'),
    ).toThrow(ValidationError);
  });

  it('rejects javascript and data schemes', () => {
    expect(() => assertSafeAppRedirectUrl('javascript:alert(1)', 'successUrl')).toThrow();
    expect(() => assertSafeAppRedirectUrl('data:text/html,hi', 'cancelUrl')).toThrow();
  });

  it('rejects URLs with embedded credentials', () => {
    expect(() =>
      assertSafeAppRedirectUrl('http://user:pass@localhost:3000/ok', 'successUrl'),
    ).toThrow(ValidationError);
  });

  it('allows storage redirects only to R2_PUBLIC_URL origin', () => {
    const ok = assertSafeStorageRedirectUrl('https://files.example-cdn.com/path/file.pdf');
    expect(ok).toContain('files.example-cdn.com');
    expect(() =>
      assertSafeStorageRedirectUrl('https://evil-cdn.example/file.pdf'),
    ).toThrow(ValidationError);
  });

  it('lists allowed app origins including FRONTEND_URL', () => {
    const origins = getAllowedRedirectOrigins();
    expect(origins).toContain('http://localhost:3000');
  });
});
