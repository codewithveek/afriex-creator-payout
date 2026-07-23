import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { formatMoney, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { Withdrawal, Creator } from '@/lib/types'
import { WithdrawalsClient } from './client'

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

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (status === 'COMPLETED' || status === 'PAID') return 'success'
  if (status === 'PENDING' || status === 'QUEUED') return 'warning'
  if (status === 'PROCESSING') return 'info'
  if (status === 'FAILED') return 'error'
  return 'default'
}

async function WithdrawalsContent() {
  const cookie = await getCookieHeader()
  const [creatorRes, { data: withdrawals }] = await Promise.all([
    getCreator(cookie),
    getWithdrawals(cookie),
  ])

  const creator = creatorRes?.data
  const balances = creator?.balances?.length
    ? creator.balances
    : creator
      ? [{ currency: creator.payoutCurrency, availableBalance: creator.availableBalance }]
      : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">Withdrawals</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Payouts go to your bank via Afriex. Each currency has its own balance.
          </p>
        </div>
        <WithdrawalsClient
          balances={balances}
          payoutCurrency={creator?.payoutCurrency ?? 'USD'}
        />
      </div>

      {balances.length > 1 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {balances.map((b) => (
            <Card key={b.currency}>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  {b.currency}
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-fg">
                  {formatMoney(b.availableBalance, b.currency)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-fg-muted">
            No withdrawals yet. Request a payout when your available balance is ready.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">Withdrawal history</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Withdrawal history">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th className="px-4 py-3 font-medium sm:px-6">Amount</th>
                  <th className="px-4 py-3 font-medium sm:px-6">Currency</th>
                  <th className="px-4 py-3 font-medium sm:px-6">Status</th>
                  <th className="px-4 py-3 font-medium sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border-light last:border-0">
                    <td className="px-4 py-3 font-medium text-fg sm:px-6">
                      {formatMoney(w.amount, w.currency)}
                    </td>
                    <td className="px-4 py-3 text-fg-muted sm:px-6">{w.currency}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <Badge variant={statusVariant(w.status)}>{w.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-fg-subtle sm:px-6">
                      {formatDate(w.createdAt)}
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
        <div className="space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <CardSkeleton />
        </div>
      }
    >
      <WithdrawalsContent />
    </Suspense>
  )
}
