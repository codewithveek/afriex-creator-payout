import { cache } from 'react'
import { apiFetch } from './api-client'
import { getCookieHeader } from './cookies'
import type { Session } from './types'

/**
 * The signed-in creator, or null. Memoized per render pass so the layout, the
 * page, and the site header can each ask without triggering repeat API calls
 * (React `cache` — see the Next.js authentication guide's DAL pattern).
 */
export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const cookie = await getCookieHeader()
    // No cookies at all means no session to verify: skip the round trip so
    // anonymous marketing pages don't wait on the API to render their header.
    if (!cookie) return null
    return await apiFetch<Session>('/api/auth/get-session', { cookie })
  } catch {
    return null
  }
})
