import { describe, it, expect, beforeAll } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/db';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.BETTER_AUTH_SECRET ??= 'a-very-long-random-secret-string-for-testing-purposes';
process.env.BETTER_AUTH_URL ??= 'http://localhost:4000';
process.env.FRONTEND_URL ??= 'http://localhost:3000';
process.env.AFRIEX_API_KEY ??= 'fake_key';
process.env.AFRIEX_WEBHOOK_PUBLIC_KEY ??= 'fake_webhook_key';
process.env.PAYOUT_SECRETS_ENCRYPTION_KEY ??= 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=';
process.env.RESEND_API_KEY ??= 're_fake';
process.env.RESEND_FROM_EMAIL ??= 'test@example.com';

const {
  encryptPii,
  decryptPii,
  isEncryptedPii,
  blindIndex,
  hashToken,
  maskEmail,
  encryptSecret,
  decryptSecret,
} = await import('../encryption');

describe('encryption / PII', () => {
  it('round-trips AES-GCM secrets', () => {
    const { ciphertextBase64, ivBase64 } = encryptSecret('secret-account-999');
    expect(decryptSecret({ ciphertextBase64, ivBase64 })).toBe('secret-account-999');
  });

  it('encrypts PII with packed format and decrypts', () => {
    const enc = encryptPii('buyer@example.com');
    expect(isEncryptedPii(enc)).toBe(true);
    expect(decryptPii(enc)).toBe('buyer@example.com');
  });

  it('treats legacy plaintext as decryptable without throwing', () => {
    expect(decryptPii('legacy@example.com')).toBe('legacy@example.com');
    expect(isEncryptedPii('legacy@example.com')).toBe(false);
  });

  it('produces stable blind indexes for normalized emails', () => {
    const a = blindIndex('Ada@Example.COM', 'email');
    const b = blindIndex('ada@example.com', 'email');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(blindIndex('other@example.com', 'email')).not.toBe(a);
  });

  it('hashes tokens deterministically', () => {
    const t = 'a'.repeat(64);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toHaveLength(64);
  });

  it('masks emails for logs', () => {
    expect(maskEmail('jane@example.com')).toBe('j***@example.com');
  });
});
