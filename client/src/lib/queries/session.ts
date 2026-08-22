import { api } from '@/lib/api-client'

/** Ends the account's session. Callers should `router.refresh()` afterwards. */
export async function signOut() {
  await api.post('/api/auth/sign-out')
}
