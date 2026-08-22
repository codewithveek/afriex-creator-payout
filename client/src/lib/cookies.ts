import { cookies } from 'next/headers'


/** Cookie header string for server-side API calls (Next.js 15+ cookies() is async). */
export async function getCookieHeader(): Promise<string | null> {
  const store = await cookies()
  const all = store.getAll()
  if (all.length === 0) return null
  return all.map((c) => `${c.name}=${c.value}`).join('; ')
}
