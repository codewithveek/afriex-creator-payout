'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Download, Package } from 'lucide-react'
import { ApiClientError } from '@/lib/api-client'
import { formatMoney, API_BASE } from '@/lib/utils'
import { queryKeys } from '@/lib/queries/keys'
import { fetchOrderBySession } from '@/lib/queries/orders'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function SuccessContent() {
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
    // Poll until webhook marks the order COMPLETED (or we give up after ~12s)
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

  const loadError =
    !session
      ? email
        ? 'Payment received. Sign in on the orders page with your email to find your download.'
        : 'Missing payment reference. Check your email for the receipt, or open Your orders.'
      : orderQuery.isError
        ? orderQuery.error instanceof ApiClientError
          ? orderQuery.error.message
          : 'We could not load your order yet. Check your email shortly.'
        : ''

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <Card className="shadow-lift">
        <CardContent className="p-8 text-center">
          {stillPolling && !order ? (
            <div className="space-y-4">
              <Skeleton className="mx-auto h-14 w-14 rounded-full" />
              <Skeleton className="mx-auto h-7 w-48" />
              <Skeleton className="mx-auto h-4 w-64" />
              <p className="text-xs text-fg-subtle">Confirming payment…</p>
            </div>
          ) : completed && order ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-muted text-success">
                <CheckCircle2 className="h-8 w-8" aria-hidden />
              </div>
              <h1 className="font-display mt-5 text-2xl font-semibold text-fg">Payment confirmed</h1>
              <p className="mt-2 text-sm text-fg-muted">
                Thanks, {order.customerName}. Your copy of{' '}
                <strong className="font-medium text-fg">{order.productName ?? 'your product'}</strong>{' '}
                is ready.
              </p>
              <p className="mt-4 font-display text-2xl font-semibold text-fg">
                {formatMoney(order.amount, order.currency)}
              </p>
              <p className="mt-1 text-xs text-fg-subtle">Receipt sent to {order.customerEmail}</p>

              {downloadHref && (
                <Button href={downloadHref} size="lg" className="mt-8 w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download now
                </Button>
              )}

              {completed && order.downloadExpired && (
                <p className="mt-6 text-sm text-warning">
                  Your download link has expired. Open Your orders and request a new link.
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  href={`/customer/orders?email=${encodeURIComponent(order.customerEmail)}`}
                  variant={downloadHref ? 'outline' : 'primary'}
                  className="w-full"
                >
                  View all orders
                </Button>
                <Button href="/discover" variant="ghost" className="w-full">
                  Continue browsing
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-muted text-warning">
                <Package className="h-7 w-7" aria-hidden />
              </div>
              <h1 className="font-display mt-5 text-2xl font-semibold text-fg">
                {loadError ? 'Almost there' : 'Payment processing'}
              </h1>
              <p className="mt-2 text-sm text-fg-muted">
                {loadError ||
                  'Your payment is still confirming. This usually takes a few seconds. Check your email for a receipt, or open Your orders with the email you used at checkout.'}
              </p>
              <div className="mt-8 flex flex-col gap-2">
                <Button
                  href={
                    email
                      ? `/customer/orders?email=${encodeURIComponent(email)}`
                      : '/customer/orders'
                  }
                  className="w-full"
                >
                  Go to your orders
                </Button>
                <Button href="/discover" variant="outline" className="w-full">
                  Back to Discover
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PurchaseSuccessPage() {
  return (
    <MarketingShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 py-16">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </MarketingShell>
  )
}
