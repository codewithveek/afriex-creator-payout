'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/lib/api-client'
import { queryKeys } from '@/lib/queries/keys'
import { customerLogout, fetchCustomerMe } from '@/lib/queries/customers'
import {
  clearCustomerToken,
  readCustomerToken,
  subscribeCustomerToken,
  writeCustomerToken,
} from '@/lib/customer-token'
import type { Customer } from '@/lib/types'

export type CustomerAuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface CustomerAuthValue {
  /** Bearer token for `x-customer-token`, or null when nobody is signed in. */
  token: string | null
  /** Who the token belongs to. Null while it is still being verified. */
  customer: Customer | null
  status: CustomerAuthStatus
  signIn: (customer: Customer) => void
  signOut: () => void
}

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null)

const noopSubscribe = () => () => {}
const onServer = () => false
const inBrowser = () => true
const noTokenOnServer = () => null

/**
 * Buyer sign-in state, shared by the site header, the orders page, and
 * checkout. The token lives in browser storage, so it is unknown during the
 * server render: `status` reports `loading` until hydration, and callers must
 * not paint a signed-out UI before then or signed-in buyers see a login form.
 */
export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const hydrated = useSyncExternalStore(noopSubscribe, inBrowser, onServer)
  const token = useSyncExternalStore(subscribeCustomerToken, readCustomerToken, noTokenOnServer)

  const meQuery = useQuery({
    queryKey: token ? queryKeys.customerMe(token) : ['customers', 'me', 'none'],
    queryFn: async () => {
      try {
        return await fetchCustomerMe(token!)
      } catch (err) {
        // The token is gone for good — drop it so the UI stops claiming a session.
        if (err instanceof ApiClientError && err.status === 401) clearCustomerToken()
        throw err
      }
    },
    enabled: hydrated && Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const signIn = useCallback(
    (customer: Customer) => {
      if (!customer.token) return
      queryClient.setQueryData(queryKeys.customerMe(customer.token), {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      })
      writeCustomerToken(customer.token)
    },
    [queryClient],
  )

  const signOut = useCallback(() => {
    const current = token
    clearCustomerToken()
    queryClient.removeQueries({ queryKey: ['customers'] })
    // Best effort: invalidate it server-side too, so signing out isn't only a
    // browser-local act.
    if (current) void customerLogout(current).catch(() => {})
  }, [token, queryClient])

  const value = useMemo<CustomerAuthValue>(() => {
    let status: CustomerAuthStatus
    if (!hydrated) status = 'loading'
    else if (!token) status = 'unauthenticated'
    else if (meQuery.isPending) status = 'loading'
    // A check that failed for some reason other than a 401 (offline, API
    // hiccup) keeps the token: it is probably still good, and the orders
    // request will say otherwise if it isn't.
    else status = 'authenticated'

    return {
      token: status === 'authenticated' ? token : null,
      customer: meQuery.data ?? null,
      status,
      signIn,
      signOut,
    }
  }, [hydrated, token, meQuery.isPending, meQuery.data, signIn, signOut])

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth(): CustomerAuthValue {
  const value = useContext(CustomerAuthContext)
  if (!value) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider')
  return value
}
