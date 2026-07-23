import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Package, Wallet } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { formatMoney, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SaleRecord, Withdrawal, Creator, Product } from '@/lib/types'

function saleAmount(sale: SaleRecord): number {
  return Number.parseFloat(sale.grossAmount ?? sale.amount ?? '0')
}

async function getSales(cookie: string | null) {
  try {
    return await apiFetch<{ data: SaleRecord[] }>('/api/sales/me', { cookie })
  } catch {
    return { data: [] as SaleRecord[] }
  }
}

async function getWithdrawals(cookie: string | null) {
  try {
    return await apiFetch<{ data: Withdrawal[] }>('/api/withdrawals/me', { cookie })
  } catch {
    return { data: [] as Withdrawal[] }
  }
}

async function getCreator(cookie: string | null) {
  try {
    return await apiFetch<{ data: Creator }>('/api/creators/me', { cookie })
  } catch {
    return null
  }
}

async function getProducts(cookie: string | null) {
  try {
    return await apiFetch<{ data: Product[] }>('/api/products/mine', { cookie })
  } catch {
    return { data: [] as Product[] }
  }
}

async function DashboardContent() {
  const cookie = await getCookieHeader()
  const session = await getSession()
  const [sales, withdrawals, creatorRes, products] = await Promise.all([
    getSales(cookie),
    getWithdrawals(cookie),
    getCreator(cookie),
    getProducts(cookie),
  ])

  const creator = creatorRes?.data
  const totalGross = sales.data.reduce((sum, s) => sum + saleAmount(s), 0)
  const currency = creator?.payoutCurrency ?? sales.data[0]?.currency ?? 'USD'
  const balance = creator?.availableBalance ?? '0'
  const multiBalances = creator?.balances?.filter(
    (b) => Number.parseFloat(b.availableBalance) > 0 || b.currency === currency,
  )
  const paidOut = withdrawals.data
    .filter((w) => w.status === 'COMPLETED' || w.status === 'PAID')
    .reduce((sum, w) => sum + Number.parseFloat(w.amount), 0)
  const publishedCount = products.data.filter((p) => p.published).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Welcome back{session ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Your balance is the first thing that matters. Everything else supports it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/products">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Package className="h-4 w-4" />
              Products
            </Button>
          </Link>
          <Link href="/dashboard/withdrawals">
            <Button size="sm" className="gap-1.5">
              <Wallet className="h-4 w-4" />
              Withdraw
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2 border-accent/20 bg-gradient-to-br from-accent-muted/40 to-bg-elevated shadow-[var(--shadow-card)]">
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Available balance</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-semibold text-fg">
              {formatMoney(balance, currency)}
            </p>
            <p className="mt-2 text-xs text-fg-subtle">
              {creator?.payoutEligible
                ? 'Payout method verified · ready to withdraw via Afriex'
                : 'Add a verified bank payout method to withdraw'}
            </p>
            {multiBalances && multiBalances.length > 1 && (
              <ul className="mt-3 space-y-1 border-t border-border-light pt-3">
                {multiBalances.map((b) => (
                  <li key={b.currency} className="flex justify-between text-xs text-fg-muted">
                    <span>{b.currency}</span>
                    <span className="font-medium text-fg">
                      {formatMoney(b.availableBalance, b.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Gross sales</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold text-fg">
              {formatMoney(totalGross, currency)}
            </p>
            <p className="mt-1 text-xs text-fg-subtle">{sales.data.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Paid out</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold text-fg">
              {formatMoney(paidOut, currency)}
            </p>
            <p className="mt-1 text-xs text-fg-subtle">
              {publishedCount} live product{publishedCount === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
      </div>

      {products.data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-fg">List your first product</p>
              <p className="mt-1 text-sm text-fg-muted">
                Upload a digital file, set a price, publish, and share your store link.
              </p>
            </div>
            <Link href="/dashboard/products">
              <Button className="gap-1.5">
                Create product
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">Recent sales</h2>
          <Link href="/dashboard/earnings" className="text-sm font-medium text-accent hover:text-accent-hover">
            View all
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {sales.data.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-fg-muted">
              No sales yet. Publish a product and share it with your audience.
            </p>
          ) : (
            <table className="w-full text-sm" aria-label="Recent sales">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th className="px-4 py-3 font-medium sm:px-6">Amount</th>
                  <th className="px-4 py-3 font-medium sm:px-6">Status</th>
                  <th className="px-4 py-3 font-medium sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.data.slice(0, 8).map((sale) => (
                  <tr key={sale.id} className="border-b border-border-light last:border-0">
                    <td className="px-4 py-3 font-medium text-fg sm:px-6">
                      {formatMoney(saleAmount(sale), sale.currency)}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <Badge variant={sale.status === 'PAID' ? 'success' : 'default'}>
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-fg-subtle sm:px-6">{formatDate(sale.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <Card>
            <TableSkeleton rows={4} />
          </Card>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
