import { cookies } from 'next/headers'

/** Set by the browser next to the buyer token — see `lib/customer-token.ts`. */
const BUYER_HINT_COOKIE = 'acp.buyer'

/** Cookie header string for server-side API calls (Next.js 15+ cookies() is async). */
export async function getCookieHeader(): Promise<string | null> {
  const store = await cookies()
  const all = store.getAll()
  if (all.length === 0) return null
  return all.map((c) => `${c.name}=${c.value}`).join('; ')
}

/**
 * Whether a buyer session probably exists, so the first HTML can show the
 * signed-in header instead of correcting itself after hydration. It's a hint,
 * not proof — the token itself is verified in the browser.
 */
export async function hasBuyerSessionHint(): Promise<boolean> {
  const store = await cookies()
  return store.get(BUYER_HINT_COOKIE)?.value === '1'
}
