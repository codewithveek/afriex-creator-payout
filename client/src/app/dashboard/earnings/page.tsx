import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { formatMoney, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
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

  const stats = [
    { label: 'Buyers paid', value: formatMoney(totalGross, currency), tone: 'default' as const },
    {
      label: `Platform fee (${feePercent}%)`,
      value: `−${formatMoney(estimatedFee, currency)}`,
      tone: 'muted' as const,
    },
    { label: 'Yours', value: formatMoney(estimatedNet, currency), tone: 'success' as const },
    {
      label: 'Withdrawn so far',
      value: formatMoney(totalPaid, currency),
      tone: 'default' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Earnings"
        description="What buyers paid, what the flat fee took, and what is left for you. Same numbers your balance is built from."
        actions={
          <Button href="/dashboard/withdrawals" size="sm">
            Cash out {formatMoney(available, currency)}
          </Button>
        }
      />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-bg-elevated p-5">
            <dt className="text-sm font-semibold text-fg-muted">{stat.label}</dt>
            <dd
              className={`tabular font-display mt-1.5 text-2xl ${
                stat.tone === 'success'
                  ? 'text-success'
                  : stat.tone === 'muted'
                    ? 'text-fg-muted'
                    : 'text-fg'
              }`}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg text-fg">Every sale, line by line</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {sales.data.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-fg-muted">
              Nothing sold yet. When a buyer pays, the gross, the fee, and your share all show up
              here.
            </p>
          ) : (
            <table className="w-full text-sm" aria-label="Sales history">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Buyer paid
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Your share
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
                {sales.data.map((sale) => {
                  const gross = saleAmount(sale)
                  const net = gross * (1 - feePercent / 100)
                  return (
                    <tr key={sale.id} className="border-b border-border-light last:border-0">
                      <td className="tabular px-4 py-3 font-semibold text-fg sm:px-6">
                        {formatMoney(gross, sale.currency)}
                      </td>
                      <td className="tabular px-4 py-3 font-semibold text-success sm:px-6">
                        {formatMoney(net, sale.currency)}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <Badge variant={sale.status === 'PAID' ? 'success' : 'default'}>
                          {sale.status === 'PAID' ? 'Paid' : sale.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-fg-muted sm:px-6">
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
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-28 rounded-2xl" />
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
