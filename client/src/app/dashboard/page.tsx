import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
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

async function DashboardContent() {
  const cookie = await getCookieHeader()
  const session = await getSession()
  const [sales, withdrawals] = await Promise.all([
    getSales(cookie),
    getWithdrawals(cookie),
  ])

  const totalEarnings = sales.data.reduce(
    (sum, s) => sum + Number.parseFloat(s.amount),
    0,
  )

  const paidOut = withdrawals.data
    .filter((w) => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + Number.parseFloat(w.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-fg">Welcome back{session ? `, ${session.user.name}` : ''}</h1>
        <p className="mt-1 text-sm text-fg-muted">Your payout overview</p>
      </div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Total Sales</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-fg">
              ${totalEarnings.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Paid Out</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-fg">
              ${paidOut.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-fg-muted">Sales</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-fg">
              {sales.data.length}
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              {withdrawals.data.length} withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {sales.data.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">Recent Sales</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Recent sales">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th className="px-4 sm:px-6 py-3 font-medium">Amount</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Currency</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Description</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.data.slice(0, 10).map((sale) => (
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <Card>
          <TableSkeleton rows={4} />
        </Card>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
