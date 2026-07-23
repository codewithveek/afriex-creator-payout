/** Pure helpers for download token lifetime checks. */

export function isDownloadTokenExpired(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (expiresAt == null) {
    // Legacy orders without expiry are treated as expired for security
    // once we require TTL. Callers that want grandfathering can pass a future date.
    return true;
  }
  const exp = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return exp.getTime() <= now.getTime();
}

export function computeDownloadExpiry(
  ttlDays: number,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + ttlDays * 24 * 60 * 60 * 1000);
}

/**
 * Whether a completed order may serve a download with the given token.
 */
export function canServeDownload(params: {
  status: string;
  storedToken: string | null | undefined;
  presentedToken: string;
  expiresAt: Date | string | null | undefined;
  now?: Date;
  /** If true, missing expiresAt is allowed (legacy). Default false. */
  allowLegacyNoExpiry?: boolean;
}): boolean {
  if (params.status !== 'COMPLETED') return false;
  if (!params.storedToken || params.storedToken !== params.presentedToken) return false;

  if (params.expiresAt == null) {
    return params.allowLegacyNoExpiry === true;
  }

  return !isDownloadTokenExpired(params.expiresAt, params.now);
}
