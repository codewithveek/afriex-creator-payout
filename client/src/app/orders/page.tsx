import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Download, Package, RefreshCw } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getCookieHeader } from '@/lib/cookies'
import { fetchLibrary } from '@/lib/queries/orders'
import { formatMoney, formatDate, API_BASE } from '@/lib/utils'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { RenewDownloadButton } from './client'
import type { Order } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Your orders',
  description: 'Everything you have bought, ready to download again.',
}

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

async function loadOrders(): Promise<{ orders: Order[]; failed: boolean }> {
  try {
    return { orders: await fetchLibrary(await getCookieHeader()), failed: false }
  } catch {
    return { orders: [], failed: true }
  }
}

export default async function OrdersPage() {
  const session = await getSession()
  // One account, one sign-in: no separate buyer login to bounce through.
  if (!session?.user) redirect(`/login?next=${encodeURIComponent('/orders')}`)

  const { orders, failed } = await loadOrders()

  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="display-md text-fg">Your orders</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            {orders.length > 0
              ? 'Download anything here as many times as you need.'
              : 'Your purchases will show up here.'}
          </p>
          <p className="mt-1 text-sm text-fg-subtle">Signed in as {session.user.email}</p>
        </div>

        {failed && (
          <div
            className="mb-5 rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
            role="alert"
          >
            We couldn’t load your orders. Refresh in a moment.
          </div>
        )}

        {orders.length === 0 && !failed ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Nothing bought yet"
            description="When you buy something, it lands here with a download button. Purchases you made as a guest with this email show up here too."
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
                  <RenewDownloadButton orderId={order.id}>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Get a fresh link
                  </RenewDownloadButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </MarketingShell>
  )
}
