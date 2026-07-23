import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { formatMoney, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { SaleRecord, Withdrawal, Creator } from '@/lib/types'

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

async function EarningsContent() {
  const cookie = await getCookieHeader()
  const [sales, withdrawals, creatorRes] = await Promise.all([
    getSales(cookie),
    getWithdrawals(cookie),
    getCreator(cookie),
  ])

  const currency = creatorRes?.data?.payoutCurrency ?? sales.data[0]?.currency ?? 'USD'
  const feePercent = 10
  const totalGross = sales.data.reduce((s, r) => s + saleAmount(r), 0)
  const estimatedFee = totalGross * (feePercent / 100)
  const estimatedNet = totalGross - estimatedFee
  const totalPaid = withdrawals.data
    .filter((w) => w.status === 'COMPLETED' || w.status === 'PAID')
    .reduce((s, w) => s + Number.parseFloat(w.amount), 0)
  const available = Number.parseFloat(creatorRes?.data?.availableBalance ?? '0')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-fg">Earnings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Gross sales, platform fee (~{feePercent}%), and what you can withdraw via Afriex.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Gross sales</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold text-fg">
              {formatMoney(totalGross, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Est. platform fee</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold text-fg">
              {formatMoney(estimatedFee, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Est. net earnings</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold text-success">
              {formatMoney(estimatedNet, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent-muted/30">
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Available to withdraw</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold text-fg">
              {formatMoney(available, currency)}
            </p>
            <p className="mt-1 text-xs text-fg-subtle">
              Paid out: {formatMoney(totalPaid, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-fg">Sales history</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {sales.data.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-fg-muted">
              No sales yet. Once a buyer pays, it shows up here with fee breakdown on your balance.
            </p>
          ) : (
            <table className="w-full text-sm" aria-label="Sales history">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th className="px-4 py-3 font-medium sm:px-6">Gross</th>
                  <th className="px-4 py-3 font-medium sm:px-6">Est. net</th>
                  <th className="px-4 py-3 font-medium sm:px-6">Status</th>
                  <th className="px-4 py-3 font-medium sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.data.map((sale) => {
                  const gross = saleAmount(sale)
                  const net = gross * (1 - feePercent / 100)
                  return (
                    <tr key={sale.id} className="border-b border-border-light last:border-0">
                      <td className="px-4 py-3 font-medium text-fg sm:px-6">
                        {formatMoney(gross, sale.currency)}
                      </td>
                      <td className="px-4 py-3 text-fg-muted sm:px-6">
                        {formatMoney(net, sale.currency)}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <Badge variant={sale.status === 'PAID' ? 'success' : 'default'}>
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-fg-subtle sm:px-6">
                        {formatDate(sale.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function EarningsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
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
      <EarningsContent />
    </Suspense>
  )
}
