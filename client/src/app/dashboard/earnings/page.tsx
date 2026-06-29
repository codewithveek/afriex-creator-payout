import { Suspense } from 'react'
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
        <h1 className="text-2xl font-semibold text-gray-900">Earnings</h1>
        <p className="mt-1 text-sm text-gray-500">Track your sales and payouts</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">Gross Sales</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">${totalGross.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">Paid Out</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">Pending</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              ${(totalGross - totalPaid).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Sales History</h2>
        </CardHeader>
        <CardContent className="p-0">
          {sales.data.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">No sales yet</p>
          ) : (
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
                {sales.data.map((sale) => (
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
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <EarningsContent />
    </Suspense>
  )
}
