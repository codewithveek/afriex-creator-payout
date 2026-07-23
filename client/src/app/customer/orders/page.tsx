'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Package } from 'lucide-react'
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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
          ? 'Authentication failed'
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
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-fg">Your orders</h1>
          <p className="mt-2 text-sm text-fg-muted">
            {sessionExpired
              ? 'Your session expired. Log in again to view downloads.'
              : 'Log in with the email you used at checkout to download your purchases. Guest checkout works without an account; create one here to keep a permanent history.'}
          </p>
        </div>

        {authError && (
          <div className="rounded-lg bg-error-muted p-3 text-sm text-error" role="alert">
            {authError}
          </div>
        )}

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">
              {signingUp ? 'Create a buyer account' : 'Log in'}
            </h2>
          </CardHeader>
          <CardContent>
            {signingUp ? (
              <form onSubmit={handleSignup} className="space-y-4">
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
                />
                <Button type="submit" loading={authPending} className="w-full">
                  Sign up
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
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
                <Button type="submit" loading={authPending} className="w-full">
                  Log in
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-fg-muted">
              {signingUp ? 'Already have an account?' : 'No account yet?'}{' '}
              <button
                type="button"
                onClick={() => setSigningUp(!signingUp)}
                className="font-medium text-accent hover:text-accent-hover"
              >
                {signingUp ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-fg-subtle">
          Looking for a product?{' '}
          <Link href="/store" className="font-medium text-accent hover:underline">
            Browse the store
          </Link>
        </p>
      </div>
    )
  }

  const orders = ordersQuery.data ?? []
  const listError =
    ordersQuery.error instanceof ApiClientError
      ? ordersQuery.error.message
      : ordersQuery.isError
        ? 'Failed to load orders'
        : ''

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">Your orders</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Downloads for purchases you made on Afriex Creators.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>

      {listError && (
        <div className="mb-4 rounded-lg bg-error-muted p-3 text-sm text-error" role="alert">
          {listError}
        </div>
      )}

      {ordersQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
            role="status"
            aria-label="Loading orders"
          />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No orders yet"
          description="When you buy a product, it will appear here with a download button."
          action={
            <Link href="/store">
              <Button>Browse store</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="shadow-[var(--shadow-card)]">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-fg">
                      {order.product?.name || 'Digital product'}
                    </h2>
                    <Badge variant={statusVariant[order.status] ?? 'default'}>{order.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    {formatMoney(order.amount, order.currency)} · {formatDate(order.createdAt)}
                  </p>
                </div>
                {order.status === 'COMPLETED' && order.downloadToken && !order.downloadExpired && (
                  <a
                    href={`${API_BASE}/api/download/${order.id}/${order.downloadToken}`}
                    className="inline-flex"
                  >
                    <Button className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </a>
                )}
                {order.status === 'COMPLETED' &&
                  (order.downloadExpired || !order.downloadToken) && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      loading={renewMutation.isPending && renewMutation.variables === order.id}
                      onClick={() => renewMutation.mutate(order.id)}
                    >
                      <Download className="h-4 w-4" />
                      Get new download link
                    </Button>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CustomerOrdersPage() {
  return (
    <MarketingShell>
      <div className="px-4 py-12 sm:px-6">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          }
        >
          <OrdersContent />
        </Suspense>
      </div>
    </MarketingShell>
  )
}
