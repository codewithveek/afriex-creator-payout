import { api, apiFetch } from '@/lib/api-client'
import type { Order } from '@/lib/types'

export interface OrderBySession {
  id: string
  productId: string
  productName: string | null
  customerEmail: string
  customerName: string
  amount: string
  currency: string
  status: string
  downloadToken: string | null
  downloadExpired?: boolean
  downloadTokenExpiresAt?: string | null
  createdAt: string
}

export async function fetchOrderBySession(sessionId: string) {
  const res = await api.get<{ data: OrderBySession }>(
    `/api/orders/by-session/${encodeURIComponent(sessionId)}`,
  )
  return res.data
}

/**
 * Everything the signed-in account has bought, guest purchases under the same
 * email included. Server-side call: pass the request's cookie header.
 */
export async function fetchLibrary(cookie: string | null) {
  const res = await apiFetch<{ data: Order[] }>('/api/library', { cookie })
  return res.data
}

export async function renewLibraryDownload(orderId: string) {
  const res = await api.post<{ data: { downloadToken: string; expiresAt: string } }>(
    `/api/library/${orderId}/renew-download`,
  )
  return res.data
}
