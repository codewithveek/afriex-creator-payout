/**
 * Sanitises a `?next=` value. Only same-origin absolute paths are honoured —
 * anything else (another host, a protocol-relative `//evil.com`) falls back,
 * so a login link can never be turned into an open redirect.
 */
export function safeNextPath(next: string | undefined | null, fallback: string): string {
  if (!next) return fallback
  if (!next.startsWith('/') || next.startsWith('//')) return fallback
  return next
}
