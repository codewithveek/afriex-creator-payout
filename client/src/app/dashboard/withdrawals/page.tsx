import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import type { Withdrawal } from '@/lib/types'
import { WithdrawalsClient } from './client'

async function getWithdrawals(cookie: string | null) {
  try {
    return await apiFetch<{ data: Withdrawal[] }>('/api/withdrawals/me', { cookie })
  } catch {
    return { data: [] }
  }
}

async function getBalance(cookie: string | null) {
  try {
    const res = await apiFetch<{ data: { availableBalance: string } }>('/api/creators/me', { cookie })
    return res.data.availableBalance
  } catch {
    return null
  }
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-warning-muted text-warning',
  PROCESSING: 'bg-info-muted text-info',
  COMPLETED: 'bg-success-muted text-success',
  FAILED: 'bg-error-muted text-error',
}

async function WithdrawalsContent() {
  const cookie = cookies().toString() || null
  const [balance, { data: withdrawals }] = await Promise.all([
    getBalance(cookie),
    getWithdrawals(cookie),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Withdrawals</h1>
          <p className="mt-1 text-sm text-fg-muted">Request and track your payouts</p>
        </div>
        <WithdrawalsClient balance={balance} />
      </div>

      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-fg-muted">
            No withdrawals yet
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">Withdrawal History</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Withdrawal history">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th className="px-4 sm:px-6 py-3 font-medium">Amount</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Currency</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Status</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border-light last:border-0">
                    <td className="px-4 sm:px-6 py-3 font-medium text-fg">
                      ${Number.parseFloat(w.amount).toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-fg-muted">{w.currency}</td>
                    <td className="px-4 sm:px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[w.status] || 'bg-bg-muted text-fg-muted'}`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-fg-subtle">
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
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <CardSkeleton />
      </div>
    }>
      <WithdrawalsContent />
    </Suspense>
  )
}
