import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../../config/env';

// AES-256-GCM: authenticated encryption, so tampering with the ciphertext is
// detectable (auth tag verification fails) rather than silently decrypting
// to garbage. Used exclusively for payout method secrets at rest — never
// for passwords (better-auth handles those with its own hashing) and never
// for anything that needs to be searchable/indexed in plaintext form.
//
// PAYOUT_SECRETS_ENCRYPTION_KEY must be a 32-byte key, base64-encoded.
// Generate with: openssl rand -base64 32

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits is the recommended IV length for GCM

function getKey(): Buffer {
  const key = Buffer.from(env.PAYOUT_SECRETS_ENCRYPTION_KEY, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `PAYOUT_SECRETS_ENCRYPTION_KEY must decode to exactly 32 bytes, got ${key.length}`,
    );
  }
  return key;
}

export interface EncryptedPayload {
  ciphertextBase64: string;
  ivBase64: string;
}

/**
 * Encrypts a plaintext string (e.g. a raw bank account number received
 * transiently from the client before being tokenized by Afriex). The auth
 * tag is appended to the ciphertext so decrypt() can verify integrity.
 */
export function encryptSecret(plaintext: string): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Store ciphertext + authTag together; they're split again on decrypt.
  const combined = Buffer.concat([encrypted, authTag]);

  return {
    ciphertextBase64: combined.toString('base64'),
    ivBase64: iv.toString('base64'),
  };
}

/**
 * Decrypts a payload produced by encryptSecret(). Throws if the auth tag
 * doesn't verify — meaning the ciphertext was tampered with or the wrong
 * key/IV was used.
 */
export function decryptSecret(payload: EncryptedPayload): string {
  const combined = Buffer.from(payload.ciphertextBase64, 'base64');
  const iv = Buffer.from(payload.ivBase64, 'base64');

  const authTagLength = 16; // GCM auth tag is always 16 bytes
  const authTag = combined.subarray(combined.length - authTagLength);
  const ciphertext = combined.subarray(0, combined.length - authTagLength);

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Masks an account number for display, keeping only the last 4 digits visible. */
export function maskAccountNumber(accountNumber: string): string {
  const lastFour = accountNumber.slice(-4);
  return lastFour.padStart(accountNumber.length, '*').slice(-8); // cap display width at 8 chars
}
