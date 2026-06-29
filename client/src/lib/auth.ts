'use server'

import { cookies } from 'next/headers'
import { apiFetch } from './api-client'
import type { Session } from './types'

export async function getSession(): Promise<Session | null> {
  try {
    const cookie = cookies().toString()
    return await apiFetch<Session>('/api/auth/session', { cookie: cookie || null })
  } catch {
    return null
  }
}
