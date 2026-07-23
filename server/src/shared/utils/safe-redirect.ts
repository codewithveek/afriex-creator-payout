import { env } from '../../config/env';
import { ValidationError } from '../errors';

/**
 * Open-redirect / redirect-spoofing protection.
 * Only absolute http(s) URLs whose origin is in the platform allowlist are accepted.
 */

export function getAllowedRedirectOrigins(): string[] {
  const origins = new Set<string>();

  for (const raw of [env.FRONTEND_URL, env.BETTER_AUTH_URL, env.SITE_URL]) {
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      // ignore invalid env
    }
  }

  // Local dev conveniences
  if (env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
    origins.add('http://localhost:4000');
  }

  return [...origins];
}

export function getAllowedStorageOrigins(): string[] {
  const origins: string[] = [];
  if (env.R2_PUBLIC_URL) {
    try {
      origins.push(new URL(env.R2_PUBLIC_URL).origin);
    } catch {
      // ignore
    }
  }
  for (const extra of env.ALLOWED_STORAGE_ORIGINS?.split(',') ?? []) {
    const trimmed = extra.trim();
    if (!trimmed) continue;
    try {
      origins.push(new URL(trimmed).origin);
    } catch {
      // ignore
    }
  }
  return origins;
}

/**
 * Validates a buyer/provider return URL (successUrl / cancelUrl).
 * Throws ValidationError on anything untrusted.
 */
export function assertSafeAppRedirectUrl(urlString: string, fieldName = 'url'): string {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new ValidationError(`Invalid ${fieldName}`);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new ValidationError(`Invalid ${fieldName}: only http(s) allowed`);
  }

  if (env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new ValidationError(`Invalid ${fieldName}: https required in production`);
  }

  // Block credentials in URL (user:pass@host)
  if (parsed.username || parsed.password) {
    throw new ValidationError(`Invalid ${fieldName}: credentials not allowed`);
  }

  // Block obviously dangerous payloads
  const lower = urlString.toLowerCase();
  if (lower.includes('javascript:') || lower.includes('data:') || lower.includes('vbscript:')) {
    throw new ValidationError(`Invalid ${fieldName}`);
  }

  const allowed = getAllowedRedirectOrigins();
  if (allowed.length === 0) {
    throw new ValidationError(
      `Invalid ${fieldName}: no allowed redirect origins configured (set FRONTEND_URL)`,
    );
  }

  if (!allowed.includes(parsed.origin)) {
    throw new ValidationError(
      `Invalid ${fieldName}: origin ${parsed.origin} is not an allowed app origin`,
    );
  }

  return parsed.toString();
}

/**
 * Validates a product file URL before redirecting the browser there.
 * Prevents open redirects to attacker-controlled hosts if fileUrl is poisoned.
 */
export function assertSafeStorageRedirectUrl(urlString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new ValidationError('Invalid file URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new ValidationError('Invalid file URL protocol');
  }

  if (parsed.username || parsed.password) {
    throw new ValidationError('Invalid file URL');
  }

  const allowed = getAllowedStorageOrigins();
  // If no storage allowlist configured, refuse redirect fallback (force proxy-only)
  if (allowed.length === 0) {
    throw new ValidationError('Storage redirect not allowed: configure R2_PUBLIC_URL');
  }

  if (!allowed.includes(parsed.origin)) {
    throw new ValidationError('File URL host is not an allowed storage origin');
  }

  return parsed.toString();
}
