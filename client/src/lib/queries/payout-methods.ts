import { api } from '@/lib/api-client'

export type PayoutChannel = 'BANK_ACCOUNT' | 'MOBILE_MONEY'

export interface Institution {
  institutionId: string
  institutionName: string
  institutionCode: string
}

export interface ResolvedAccount {
  accountName: string | null
  institutionName: string
}

export interface AddPayoutMethodInput {
  channel: PayoutChannel
  accountNumber: string
  institutionCode: string
  currency: string
}

/** Banks or mobile-money providers available in the creator's own country. */
export async function fetchInstitutions(channel: PayoutChannel): Promise<Institution[]> {
  const res = await api.get<{ data: Institution[] }>(
    `/api/payout-methods/institutions?channel=${channel}`,
  )
  return res.data ?? []
}

/** Confirms who owns the account before it is saved. */
export async function resolveAccount(input: {
  channel: PayoutChannel
  accountNumber: string
  institutionCode: string
}): Promise<ResolvedAccount> {
  const res = await api.post<{ data: ResolvedAccount }>('/api/payout-methods/resolve', input)
  return res.data
}

export async function addPayoutMethod(input: AddPayoutMethodInput) {
  return api.post('/api/payout-methods', input)
}
