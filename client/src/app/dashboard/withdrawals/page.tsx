import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Withdrawal } from '@/lib/types'
import { WithdrawalsClient } from './client'

async function getWithdrawals(cookie: string | null) {
  try {
    return await apiFetch<{ data: Withdrawal[] }>('/api/withdrawals/me', { cookie })
  } catch {
    return { data: [] }
  }
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  PROCESSING: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
}

async function WithdrawalsContent() {
  const cookie = cookies().toString() || null
  const { data: withdrawals } = await getWithdrawals(cookie)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Withdrawals</h1>
          <p className="mt-1 text-sm text-gray-500">Request and track your payouts</p>
        </div>
        <WithdrawalsClient />
      </div>

      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            No withdrawals yet
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Withdrawal History</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Currency</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      ${Number.parseFloat(w.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{w.currency}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[w.status] || 'bg-gray-50 text-gray-700'}`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(w.createdAt).toLocaleDateString()}
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

export default function WithdrawalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <WithdrawalsContent />
    </Suspense>
  )
}
