import type { Session } from './types'

/**
 * Marketing pages push visitors toward opening a shop. Someone who already has
 * one should be pointed at it instead — "Open your shop free" reads as a bug to
 * a creator who is signed in.
 */
export function sellerCta(session: Session | null, signedOutLabel = 'Open your shop free') {
  return session?.user
    ? { href: '/dashboard', label: 'Go to your dashboard' }
    : { href: '/signup', label: signedOutLabel }
}
