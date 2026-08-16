'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Package, RefreshCw } from 'lucide-react'
import { ApiClientError } from '@/lib/api-client'
import { formatMoney, formatDate, API_BASE } from '@/lib/utils'
import { queryKeys } from '@/lib/queries/keys'
import {
  fetchCustomerOrders,
  customerLogin,
  customerSignup,
  renewCustomerDownload,
} from '@/lib/queries/orders'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

const TOKEN_KEY = 'customerToken'

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  REFUNDED: 'error',
  FAILED: 'default',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Payment confirming',
  COMPLETED: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Payment failed',
}

function readToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const prefillEmail = searchParams.get('email') ?? ''
  const queryClient = useQueryClient()

  const [token, setToken] = useState<string | null>(() => readToken())
  const [signingUp, setSigningUp] = useState(false)

  const ordersQuery = useQuery({
    queryKey: token ? queryKeys.customerOrders(token) : ['customers', 'orders', 'anon'],
    queryFn: () => fetchCustomerOrders(token!),
    enabled: Boolean(token),
  })

  const loginMutation = useMutation({
    mutationFn: customerLogin,
    onSuccess: (customer) => {
      if (customer.token) {
        sessionStorage.setItem(TOKEN_KEY, customer.token)
        setToken(customer.token)
      }
    },
  })

  const signupMutation = useMutation({
    mutationFn: customerSignup,
    onSuccess: (customer) => {
      if (customer.token) {
        sessionStorage.setItem(TOKEN_KEY, customer.token)
        setToken(customer.token)
        setSigningUp(false)
      }
    },
  })

  const renewMutation = useMutation({
    mutationFn: (orderId: string) => renewCustomerDownload(token!, orderId),
    onSuccess: () => {
      if (token) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.customerOrders(token) })
      }
    },
  })

  const authPending = loginMutation.isPending || signupMutation.isPending
  const authError =
    loginMutation.error instanceof ApiClientError
      ? loginMutation.error.message
      : signupMutation.error instanceof ApiClientError
        ? signupMutation.error.message
        : loginMutation.error || signupMutation.error
          ? 'That didn’t work. Check the email and password and try again.'
          : ''

  const sessionExpired =
    ordersQuery.error instanceof ApiClientError && ordersQuery.error.status === 401

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    loginMutation.mutate({
      email: form.get('email') as string,
      password: form.get('password') as string,
    })
  }

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    signupMutation.mutate({
      email: form.get('email') as string,
      name: form.get('name') as string,
      password: form.get('password') as string,
    })
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY)
    if (token) {
      void queryClient.removeQueries({ queryKey: queryKeys.customerOrders(token) })
    }
    setToken(null)
  }

  if (!token || sessionExpired) {
    return (
      <div className="mx-auto grid max-w-4xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <h1 className="display-lg text-fg">Everything you&apos;ve bought, in one place</h1>
          <p className="prose-lede mt-4 text-fg-muted">
            {sessionExpired
              ? 'Your session timed out. Log back in to get to your downloads.'
              : 'Sign in with the email you used at checkout, including for guest purchases.'}
          </p>
          <ul className="mt-7 space-y-3 text-sm text-fg-muted">
            <li className="flex gap-3">
              <Download className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              Every file you&apos;ve paid for, ready to download again
            </li>
            <li className="flex gap-3">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              Expired link? Issue yourself a new one
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-bg-elevated p-7 shadow-card">
          <h2 className="font-display text-xl text-fg">
            {signingUp ? 'Create a buyer account' : 'Sign in'}
          </h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            {signingUp
              ? 'Use the same email you checked out with and your past orders come with you.'
              : 'No account yet? Creating one takes a moment.'}
          </p>

          {authError && (
            <div
              className="mt-5 rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
              role="alert"
            >
              {authError}
            </div>
          )}

          {signingUp ? (
            <form onSubmit={handleSignup} className="mt-5 space-y-4">
              <Input label="Name" name="name" required autoComplete="name" />
              <Input
                label="Email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={prefillEmail}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                hint="At least 8 characters."
              />
              <Button type="submit" size="lg" loading={authPending} className="w-full">
                Create account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <Input
                label="Email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={prefillEmail}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
              <Button type="submit" size="lg" loading={authPending} className="w-full">
                Sign in
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-fg-muted">
            {signingUp ? 'Already have an account?' : 'First time here?'}{' '}
            <button
              type="button"
              onClick={() => setSigningUp(!signingUp)}
              className="rounded font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {signingUp ? 'Sign in instead' : 'Create an account'}
            </button>
          </p>

          <p className="mt-5 border-t border-border-light pt-5 text-center text-sm text-fg-muted">
            Looking for something to buy?{' '}
            <Link href="/discover" className="font-semibold text-accent hover:underline">
              Browse the marketplace
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const orders = ordersQuery.data ?? []
  const listError =
    ordersQuery.error instanceof ApiClientError
      ? ordersQuery.error.message
      : ordersQuery.isError
        ? 'We couldn’t load your orders. Try again in a moment.'
        : ''

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-md text-fg">Your orders</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            {orders.length > 0
              ? 'Download anything here as many times as you need.'
              : 'Your purchases will show up here.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>

      {listError && (
        <div
          className="mb-5 rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
          role="alert"
        >
          {listError}
        </div>
      )}

      {ordersQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
            role="status"
            aria-label="Loading your orders"
          />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Nothing bought yet"
          description="When you buy something, it lands here with a download button."
          action={<Button href="/discover">Browse the marketplace</Button>}
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg text-fg">
                    {order.product?.name || 'Digital product'}
                  </h2>
                  <Badge variant={statusVariant[order.status] ?? 'default'}>
                    {statusLabel[order.status] ?? order.status}
                  </Badge>
                </div>
                <p className="tabular mt-1 text-sm text-fg-muted">
                  {formatMoney(order.amount, order.currency)} · {formatDate(order.createdAt)}
                </p>
              </div>
              {order.status === 'COMPLETED' && order.downloadToken && !order.downloadExpired && (
                <Button href={`${API_BASE}/api/download/${order.id}/${order.downloadToken}`}>
                  <Download className="h-4 w-4" aria-hidden />
                  Download
                </Button>
              )}
              {order.status === 'COMPLETED' && (order.downloadExpired || !order.downloadToken) && (
                <Button
                  variant="outline"
                  loading={renewMutation.isPending && renewMutation.variables === order.id}
                  onClick={() => renewMutation.mutate(order.id)}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Get a fresh link
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function CustomerOrdersPage() {
  return (
    <MarketingShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
              role="status"
              aria-label="Loading"
            />
          </div>
        }
      >
        <OrdersContent />
      </Suspense>
    </MarketingShell>
  )
}
