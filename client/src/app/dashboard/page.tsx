import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Package, Plus } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { formatMoney, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'
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
  const hasBalance = Number.parseFloat(balance) > 0
  const multiBalances = creator?.balances?.filter(
    (b) => Number.parseFloat(b.availableBalance) > 0 && b.currency !== currency,
  )
  const paidOut = withdrawals.data
    .filter((w) => w.status === 'COMPLETED' || w.status === 'PAID')
    .reduce((sum, w) => sum + Number.parseFloat(w.amount), 0)
  const publishedCount = products.data.filter((p) => p.published).length
  const firstName = session?.user.name.split(' ')[0]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-fg sm:text-[1.75rem]">
            {firstName ? `Hello, ${firstName}` : 'Your shop'}
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            {sales.data.length > 0
              ? `${sales.data.length} sale${sales.data.length === 1 ? '' : 's'} so far.`
              : 'Everything about your shop, in one place.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/products" variant="outline" size="sm">
            <Plus className="h-4 w-4" aria-hidden />
            New product
          </Button>
        </div>
      </div>

      {/* Money first */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-bg-inverse p-6 text-fg-on-inverse sm:p-7">
          <div className="ledger-lines absolute inset-0" aria-hidden />
          <div className="relative">
            <p className="text-sm font-semibold text-fg-on-inverse-muted">Yours to withdraw</p>
            <p className="tabular font-display mt-2 text-4xl text-fg-on-inverse sm:text-5xl">
              {formatMoney(balance, currency)}
            </p>

            {multiBalances && multiBalances.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
                {multiBalances.map((b) => (
                  <li key={b.currency} className="tabular text-sm text-fg-on-inverse-muted">
                    + {formatMoney(b.availableBalance, b.currency)}
                  </li>
                ))}
              </ul>
            )}

            <p className="on-ink mt-4 max-w-md text-sm text-fg-on-inverse-muted">
              {creator?.payoutEligible
                ? 'Your bank account is verified. Cash out whenever you like.'
                : 'Add a bank account so it can be verified before your first withdrawal.'}
            </p>

            <Button
              href={creator?.payoutEligible ? '/dashboard/withdrawals' : '/dashboard/payout-methods'}
              variant="signal"
              size="lg"
              className="mt-6"
            >
              {creator?.payoutEligible
                ? hasBalance
                  ? 'Cash out'
                  : 'Go to withdrawals'
                : 'Add a bank account'}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-1">
          <div className="bg-bg-elevated p-5">
            <dt className="text-sm font-semibold text-fg-muted">Sold in total</dt>
            <dd className="tabular font-display mt-1 text-2xl text-fg">
              {formatMoney(totalGross, currency)}
            </dd>
            <p className="mt-1 text-xs text-fg-muted">
              across {sales.data.length} sale{sales.data.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="bg-bg-elevated p-5">
            <dt className="text-sm font-semibold text-fg-muted">Already paid out</dt>
            <dd className="tabular font-display mt-1 text-2xl text-fg">
              {formatMoney(paidOut, currency)}
            </dd>
            <p className="mt-1 text-xs text-fg-muted">
              {publishedCount} product{publishedCount === 1 ? '' : 's'} live right now
            </p>
          </div>
        </dl>
      </div>

      {products.data.length === 0 && (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-bg-muted p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
              <Package className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-lg text-fg">Put your first product up</p>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-fg-muted">
                Upload the file, name a price, publish. You&apos;ll get a link you can share
                anywhere.
              </p>
            </div>
          </div>
          <Button href="/dashboard/products" className="shrink-0">
            Add a product
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-display text-lg text-fg">Latest sales</h2>
          <Link
            href="/dashboard/earnings"
            className="rounded text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            See all
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {sales.data.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-fg-muted">
              No sales yet. When someone buys, it lands here.
            </p>
          ) : (
            <table className="w-full text-sm" aria-label="Latest sales">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.data.slice(0, 8).map((sale) => (
                  <tr key={sale.id} className="border-b border-border-light last:border-0">
                    <td className="tabular px-4 py-3 font-semibold text-fg sm:px-6">
                      {formatMoney(saleAmount(sale), sale.currency)}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <Badge variant={sale.status === 'PAID' ? 'success' : 'default'}>
                        {sale.status === 'PAID' ? 'Paid' : sale.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-fg-muted sm:px-6">{formatDate(sale.createdAt)}</td>
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
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
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
