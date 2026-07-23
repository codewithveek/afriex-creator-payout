'use server'

import { apiFetch } from './api-client'
import { getCookieHeader } from './cookies'
import type { Session } from './types'

export async function getSession(): Promise<Session | null> {
  try {
    const cookie = await getCookieHeader()
    return await apiFetch<Session>('/api/auth/session', { cookie })
  } catch {
    return null
  }
}
