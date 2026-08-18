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
 * Buyer's own orders. A 401 means the token is stale — the caller clears it
 * through the customer-auth store rather than reaching into storage here.
 */
export async function fetchCustomerOrders(token: string) {
  const res = await api.get<{ data: Order[] }>('/api/customers/orders', {
    headers: { 'x-customer-token': token },
  })
  return res.data
}

export async function renewCustomerDownload(token: string, orderId: string) {
  const res = await apiFetch<{ data: { downloadToken: string; expiresAt: string } }>(
    `/api/customers/orders/${orderId}/renew-download`,
    {
      method: 'POST',
      headers: { 'x-customer-token': token },
    },
  )
  return res.data
}
