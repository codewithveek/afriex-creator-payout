import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { env } from '../../config/env';

// AES-256-GCM for secrets & PII at rest.
// HMAC-SHA256 blind indexes for equality search without storing plaintext.
//
// Keys:
// - PAYOUT_SECRETS_ENCRYPTION_KEY: 32-byte base64 AES key (also used for PII unless PII_ENCRYPTION_KEY set)
// - BLIND_INDEX_KEY (optional): base64 key for HMAC blind indexes; derived from encryption key if omitted

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH = 16;
const PACKED_PREFIX = 'enc:v1:';

function getAesKey(override?: string): Buffer {
  const raw = override ?? env.PII_ENCRYPTION_KEY ?? env.PAYOUT_SECRETS_ENCRYPTION_KEY;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(`Encryption key must decode to exactly 32 bytes, got ${key.length}`);
  }
  return key;
}

function getBlindIndexKey(): Buffer {
  if (env.BLIND_INDEX_KEY) {
    const key = Buffer.from(env.BLIND_INDEX_KEY, 'base64');
    if (key.length < 32) {
      throw new Error('BLIND_INDEX_KEY must decode to at least 32 bytes');
    }
    return key;
  }
  // Deterministic derivation so existing deploys work without a new secret
  return createHmac('sha256', getAesKey())
    .update('afriex-creators:blind-index:v1')
    .digest();
}

export interface EncryptedPayload {
  ciphertextBase64: string;
  ivBase64: string;
}

/**
 * Encrypts a plaintext string (bank secrets, PII). Auth tag is appended to ciphertext.
 */
export function encryptSecret(plaintext: string, keyOverride?: string): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, getAesKey(keyOverride), iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, authTag]);

  return {
    ciphertextBase64: combined.toString('base64'),
    ivBase64: iv.toString('base64'),
  };
}

export function decryptSecret(payload: EncryptedPayload, keyOverride?: string): string {
  const combined = Buffer.from(payload.ciphertextBase64, 'base64');
  const iv = Buffer.from(payload.ivBase64, 'base64');

  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(0, combined.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, getAesKey(keyOverride), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Single-column packed ciphertext: enc:v1:<iv_b64>:<ct_b64> */
export function encryptPii(plaintext: string): string {
  const { ciphertextBase64, ivBase64 } = encryptSecret(plaintext, env.PII_ENCRYPTION_KEY);
  return `${PACKED_PREFIX}${ivBase64}:${ciphertextBase64}`;
}

/**
 * Decrypts packed PII. If value is not encrypted (legacy plaintext), returns as-is
 * so gradual migration does not break reads.
 */
export function decryptPii(stored: string | null | undefined): string {
  if (stored == null || stored === '') return '';
  if (!stored.startsWith(PACKED_PREFIX)) {
    return stored; // legacy plaintext
  }
  const rest = stored.slice(PACKED_PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep < 0) throw new Error('Invalid encrypted PII format');
  const ivBase64 = rest.slice(0, sep);
  const ciphertextBase64 = rest.slice(sep + 1);
  return decryptSecret({ ivBase64, ciphertextBase64 }, env.PII_ENCRYPTION_KEY);
}

export function isEncryptedPii(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(PACKED_PREFIX);
}

/**
 * Normalize then HMAC for equality search. Same input always → same hash.
 * Use for email / phone lookups against indexed columns.
 */
export function blindIndex(value: string, purpose: 'email' | 'phone' | 'session' | 'token' = 'email'): string {
  const normalized = normalizeForIndex(value, purpose);
  return createHmac('sha256', getBlindIndexKey())
    .update(`${purpose}:`)
    .update(normalized)
    .digest('hex');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeForIndex(value: string, purpose: string): string {
  if (purpose === 'email') return normalizeEmail(value);
  if (purpose === 'phone') return value.replace(/[\s()-]/g, '').trim();
  return value.trim();
}

/** One-way hash for high-entropy secrets (session tokens, download tokens at rest). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Masks an account number for display, keeping only the last 4 digits visible. */
export function maskAccountNumber(accountNumber: string): string {
  const lastFour = accountNumber.slice(-4);
  return lastFour.padStart(accountNumber.length, '*').slice(-8);
}

/** Mask email for logs / UI: j***@example.com */
export function maskEmail(email: string): string {
  const normalized = normalizeEmail(email);
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

/** Mask phone: keep country-ish prefix and last 2 digits */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-2)}`;
}
