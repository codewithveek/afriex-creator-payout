import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import type { SaleRecord, Withdrawal } from '@/lib/types'

async function getSales(cookie: string | null) {
  try {
    return await apiFetch<{ data: SaleRecord[] }>('/api/sales/me', { cookie })
  } catch {
    return { data: [] }
  }
}

async function getWithdrawals(cookie: string | null) {
  try {
    return await apiFetch<{ data: Withdrawal[] }>('/api/withdrawals/me', { cookie })
  } catch {
    return { data: [] }
  }
}

async function EarningsContent() {
  const cookie = cookies().toString() || null
  const [sales, withdrawals] = await Promise.all([
    getSales(cookie),
    getWithdrawals(cookie),
  ])

  const totalGross = sales.data.reduce((s, r) => s + Number.parseFloat(r.amount), 0)
  const totalPaid = withdrawals.data
    .filter((w) => w.status === 'COMPLETED')
    .reduce((s, w) => s + Number.parseFloat(w.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-fg">Earnings</h1>
        <p className="mt-1 text-sm text-fg-muted">Track your sales and payouts</p>
      </div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Gross Sales</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-fg">${totalGross.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Paid Out</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">${totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Pending</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">
              ${(totalGross - totalPaid).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-fg">Sales History</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {sales.data.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-fg-muted">No sales yet</p>
          ) : (
            <table className="w-full text-sm" aria-label="Sales history">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th className="px-4 sm:px-6 py-3 font-medium">Amount</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Currency</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Description</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.data.map((sale) => (
                  <tr key={sale.id} className="border-b border-border-light last:border-0">
                    <td className="px-4 sm:px-6 py-3 font-medium text-fg">
                      ${Number.parseFloat(sale.amount).toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-fg-muted">{sale.currency}</td>
                    <td className="px-4 sm:px-6 py-3 text-fg-muted">{sale.description || '—'}</td>
                    <td className="px-4 sm:px-6 py-3 text-fg-subtle">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
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

export default function EarningsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <Card>
          <TableSkeleton rows={4} />
        </Card>
      </div>
    }>
      <EarningsContent />
    </Suspense>
  )
}
