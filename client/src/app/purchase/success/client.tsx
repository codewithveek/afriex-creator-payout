'use client'

import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Check, Download, Hourglass } from 'lucide-react'
import { ApiClientError } from '@/lib/api-client'
import { formatMoney, API_BASE } from '@/lib/utils'
import { queryKeys } from '@/lib/queries/keys'
import { fetchOrderBySession } from '@/lib/queries/orders'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function PurchaseSuccessClient() {
  const searchParams = useSearchParams()
  const session =
    searchParams.get('session') ||
    searchParams.get('reference') ||
    searchParams.get('trxref') ||
    searchParams.get('tx_ref')
  const email = searchParams.get('email')

  const orderQuery = useQuery({
    queryKey: session ? queryKeys.orderBySession(session) : ['orders', 'by-session', 'none'],
    queryFn: () => fetchOrderBySession(session!),
    enabled: Boolean(session),
    // Poll until the payment is confirmed (or we give up after ~12s)
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'COMPLETED') return false
      if (query.state.dataUpdateCount >= 8) return false
      return 1500
    },
    retry: 3,
  })

  const order = orderQuery.data
  const completed = order?.status === 'COMPLETED'
  const stillPolling =
    Boolean(session) &&
    !completed &&
    (orderQuery.isLoading || orderQuery.isFetching || orderQuery.isPending)

  const downloadHref =
    completed && order?.downloadToken && !order.downloadExpired
      ? `${API_BASE}/api/download/${order.id}/${order.downloadToken}`
      : null

  const loadError = !session
    ? email
      ? 'Payment received. Open your orders with this email to pick up the download.'
      : 'The payment reference is missing. Your receipt email has the download link.'
    : orderQuery.isError
      ? orderQuery.error instanceof ApiClientError
        ? orderQuery.error.message
        : 'We couldn’t load this order yet. Your receipt will arrive by email shortly.'
      : ''

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lift">
        {stillPolling && !order ? (
          <div className="space-y-4 p-8 text-center">
            <Skeleton className="mx-auto h-14 w-14 rounded-full" />
            <Skeleton className="mx-auto h-8 w-52" />
            <Skeleton className="mx-auto h-4 w-64" />
            <p className="text-sm text-fg-muted" role="status">
              Confirming your payment…
            </p>
          </div>
        ) : completed && order ? (
          <>
            <div className="relative overflow-hidden bg-bg-inverse px-8 py-10 text-center text-fg-on-inverse">
              <div className="ledger-lines absolute inset-0" aria-hidden />
              <div className="relative">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-signal text-fg">
                  <Check className="h-7 w-7" strokeWidth={3} aria-hidden />
                </div>
                <h1 className="display-md mt-5 text-fg-on-inverse">Paid. It&apos;s yours.</h1>
                <p className="on-ink mt-2 text-sm text-fg-on-inverse-muted">
                  Thanks{order.customerName ? `, ${order.customerName.split(' ')[0]}` : ''}. Your
                  copy is ready.
                </p>
              </div>
            </div>

            <div className="p-8">
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-fg-muted">Product</dt>
                  <dd className="text-right font-semibold text-fg">
                    {order.productName ?? 'Your product'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-fg-muted">Paid</dt>
                  <dd className="tabular font-semibold text-fg">
                    {formatMoney(order.amount, order.currency)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-fg-muted">Receipt sent to</dt>
                  <dd className="text-right break-all text-fg">{order.customerEmail}</dd>
                </div>
              </dl>

              {downloadHref && (
                <Button href={downloadHref} size="lg" className="mt-7 w-full">
                  <Download className="h-4 w-4" aria-hidden />
                  Download now
                </Button>
              )}

              {order.downloadExpired && (
                <p className="mt-6 rounded-lg bg-warning-muted p-3 text-sm font-medium text-warning">
                  This download link has expired. Open your orders to issue a fresh one.
                </p>
              )}

              <div className="mt-3 flex flex-col gap-2">
                <Button
                  href={`/customer/orders?email=${encodeURIComponent(order.customerEmail)}`}
                  variant={downloadHref ? 'outline' : 'primary'}
                  className="w-full"
                >
                  Keep it in your orders
                </Button>
                <Button href="/discover" variant="ghost" className="w-full">
                  Back to the marketplace
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-muted text-warning">
              <Hourglass className="h-6 w-6" aria-hidden />
            </div>
            <h1 className="display-md mt-5 text-fg">
              {loadError ? 'Nearly there' : 'Confirming your payment'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              {loadError ||
                'This usually takes a few seconds. Your receipt and download link are on their way to your inbox.'}
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <Button
                href={
                  email ? `/customer/orders?email=${encodeURIComponent(email)}` : '/customer/orders'
                }
                className="w-full"
              >
                Open your orders
              </Button>
              <Button href="/discover" variant="outline" className="w-full">
                Back to the marketplace
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

