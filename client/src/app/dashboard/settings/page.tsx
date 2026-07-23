import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { redirect } from 'next/navigation'
import { SettingsClient } from './client'

interface CreatorProfile {
  id: string
  userId: string
  phone: string
  country: string
  availableBalance: string
  payoutCurrency: string
  payoutEligible: boolean
  lastWithdrawalAt: string | null
}

async function getCreator(cookie: string | null) {
  try {
    return await apiFetch<{ data: CreatorProfile }>('/api/creators/me', { cookie })
  } catch {
    return null
  }
}

export default async function SettingsPage() {
  const cookie = await getCookieHeader()
  const creator = await getCreator(cookie)
  if (!creator) redirect('/login')

  return <SettingsClient creator={creator.data} />
}
