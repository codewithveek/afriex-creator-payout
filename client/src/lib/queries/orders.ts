import { api, ApiClientError } from '@/lib/api-client'
import type { Order, Customer } from '@/lib/types'

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
  createdAt: string
}

export async function fetchOrderBySession(sessionId: string) {
  const res = await api.get<{ data: OrderBySession }>(
    `/api/orders/by-session/${encodeURIComponent(sessionId)}`,
  )
  return res.data
}

export async function fetchCustomerOrders(token: string) {
  try {
    const res = await api.get<{ data: Order[] }>('/api/customers/orders', {
      headers: { 'x-customer-token': token },
    })
    return res.data
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401 && typeof window !== 'undefined') {
      sessionStorage.removeItem('customerToken')
    }
    throw err
  }
}

export async function customerLogin(input: { email: string; password: string }) {
  const res = await api.post<{ data: Customer }>('/api/customers/login', input)
  return res.data
}

export async function customerSignup(input: {
  email: string
  name: string
  password: string
}) {
  await api.post('/api/customers/signup', input)
  return customerLogin({ email: input.email, password: input.password })
}
