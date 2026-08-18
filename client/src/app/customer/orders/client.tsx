'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Download, Package, RefreshCw } from 'lucide-react'
import { ApiClientError } from '@/lib/api-client'
import { formatMoney, formatDate, API_BASE } from '@/lib/utils'
import { queryKeys } from '@/lib/queries/keys'
import { fetchCustomerOrders, renewCustomerDownload } from '@/lib/queries/orders'
import { customerLogin, customerSignup } from '@/lib/queries/customers'
import { useCustomerAuth } from '@/components/providers/customer-auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import type { Customer } from '@/lib/types'

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

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-16">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
        role="status"
        aria-label={label}
      />
    </div>
  )
}

interface Props {
  /** Email of the signed-in creator, if any — buyer accounts are separate. */
  creatorEmail?: string | null
  /** Server-side hint that a buyer session exists; the token itself is client-only. */
  buyerHint?: boolean
}

export function CustomerOrdersClient({ creatorEmail = null, buyerHint = false }: Props) {
  const searchParams = useSearchParams()
  const { token, customer, status, signIn, signOut } = useCustomerAuth()
  const [expired, setExpired] = useState(false)

  const handleSessionExpired = useCallback(() => {
    setExpired(true)
    signOut()
  }, [signOut])

  const handleSignedIn = useCallback(
    (signedIn: Customer) => {
      setExpired(false)
      signIn(signedIn)
    },
    [signIn],
  )

  // Storage is only readable in the browser, so wait for the buyer session to
  // resolve before deciding. Rendering the sign-in form here is what made
  // signed-in buyers think they'd been logged out. Visitors with no session
  // hint skip the wait and go straight to the form.
  if (status === 'loading' && buyerHint) return <Spinner label="Checking your account" />

  if (status === 'unauthenticated' || !token) {
    return (
      <SignInPanel
        prefillEmail={searchParams.get('email') ?? creatorEmail ?? ''}
        expired={expired}
        creatorEmail={creatorEmail}
        onSignedIn={handleSignedIn}
      />
    )
  }

  return (
    <OrdersPanel
      token={token}
      customer={customer}
      onSessionExpired={handleSessionExpired}
      onSignOut={signOut}
    />
  )
}

function SignInPanel({
  prefillEmail,
  expired,
  creatorEmail,
  onSignedIn,
}: {
  prefillEmail: string
  expired: boolean
  creatorEmail: string | null
  onSignedIn: (customer: Customer) => void
}) {
  const [signingUp, setSigningUp] = useState(false)

  const loginMutation = useMutation({
    mutationFn: customerLogin,
    onSuccess: onSignedIn,
  })

  const signupMutation = useMutation({
    mutationFn: customerSignup,
    onSuccess: (customer) => {
      setSigningUp(false)
      onSignedIn(customer)
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

  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
      <div>
        <h1 className="display-lg text-fg">Everything you&apos;ve bought, in one place</h1>
        <p className="prose-lede mt-4 text-fg-muted">
          {expired
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

        {creatorEmail && (
          <p className="mt-4 rounded-lg border border-border-light bg-bg-muted p-3 text-sm text-fg-muted">
            You&apos;re signed in as a seller ({creatorEmail}). Buying is a separate account, so
            sign in below to see what you&apos;ve bought.
          </p>
        )}

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

function OrdersPanel({
  token,
  customer,
  onSessionExpired,
  onSignOut,
}: {
  token: string
  customer: Customer | null
  onSessionExpired: () => void
  onSignOut: () => void
}) {
  const ordersQuery = useQuery({
    queryKey: queryKeys.customerOrders(token),
    queryFn: () => fetchCustomerOrders(token),
  })

  const renewMutation = useMutation({
    mutationFn: (orderId: string) => renewCustomerDownload(token, orderId),
    onSuccess: () => ordersQuery.refetch(),
  })

  const sessionExpired =
    ordersQuery.error instanceof ApiClientError && ordersQuery.error.status === 401

  useEffect(() => {
    if (sessionExpired) onSessionExpired()
  }, [sessionExpired, onSessionExpired])

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
          {customer && (
            <p className="mt-1 text-sm text-fg-subtle">Signed in as {customer.email}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onSignOut}>
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
        <Spinner label="Loading your orders" />
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
