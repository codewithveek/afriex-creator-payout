import { api } from '@/lib/api-client'

/** Ends the creator's better-auth session. Callers should `router.refresh()`. */
export async function signOutCreator() {
  await api.post('/api/auth/sign-out')
}
