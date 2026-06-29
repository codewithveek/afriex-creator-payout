import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { apiFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  const cookie = cookies().toString() || null
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
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back{session ? `, ${session.user.name}` : ''}</h1>
        <p className="mt-1 text-sm text-gray-500">Here&apos;s your payout overview</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">Total Sales</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              ${totalEarnings.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">Paid Out</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              ${paidOut.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">Sales</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {sales.data.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {withdrawals.data.length} withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {sales.data.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Currency</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.data.slice(0, 10).map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      ${Number.parseFloat(sale.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{sale.currency}</td>
                    <td className="px-6 py-3 text-gray-700">{sale.description || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
