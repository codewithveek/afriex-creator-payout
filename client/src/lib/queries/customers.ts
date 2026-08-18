import { api, apiFetch } from '@/lib/api-client'
import type { Customer } from '@/lib/types'

/** Verifies a stored buyer token and returns who it belongs to. 401 when stale. */
export async function fetchCustomerMe(token: string) {
  const res = await api.get<{ data: Customer }>('/api/customers/me', {
    headers: { 'x-customer-token': token },
  })
  return res.data
}

export async function customerLogin(input: { email: string; password: string }) {
  const res = await api.post<{ data: Customer }>('/api/customers/login', input)
  return res.data
}

export async function customerSignup(input: { email: string; name: string; password: string }) {
  await api.post('/api/customers/signup', input)
  return customerLogin({ email: input.email, password: input.password })
}

/** Invalidates the token server-side so signing out isn't only a browser-local act. */
export async function customerLogout(token: string) {
  await apiFetch('/api/customers/logout', {
    method: 'POST',
    headers: { 'x-customer-token': token },
  })
}
