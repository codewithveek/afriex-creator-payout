import { api } from '@/lib/api-client'

export interface AdminCreator {
  id: string
  user: { name: string; email: string; role: string }
  availableBalance: string
  payoutCurrency: string
  payoutEligible: boolean
  createdAt: string
}

export interface AdminWithdrawal {
  id: string
  creatorId: string
  amount: string
  currency: string
  status: string
  errorMessage: string | null
  createdAt: string
}

export interface AdminSale {
  id: string
  creatorId: string
  amount?: string
  grossAmount?: string
  currency: string
  description: string | null
  createdAt: string
}

export interface AdminPoolAccount {
  id: string
  currency: string
  balance: string
  updatedAt: string
}

export async function fetchAdminCreators() {
  const res = await api.get<{ data: AdminCreator[] }>('/api/admin/creators')
  return res.data
}

export async function fetchAdminWithdrawals() {
  const res = await api.get<{ data: AdminWithdrawal[] }>('/api/admin/withdrawals')
  return res.data
}

export async function fetchAdminSales() {
  const res = await api.get<{ data: AdminSale[] }>('/api/admin/sales')
  return res.data
}

export async function fetchAdminPoolAccounts() {
  const res = await api.get<{ data: AdminPoolAccount[] }>('/api/admin/pool-accounts')
  return res.data
}

export async function triggerAdminSweep() {
  return api.post<{ message: string }>('/api/admin/sweep/trigger')
}
