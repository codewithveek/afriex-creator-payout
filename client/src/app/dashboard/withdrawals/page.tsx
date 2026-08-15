import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { formatMoney, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
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

const statusLabel: Record<string, string> = {
  QUEUED: 'Queued',
  PENDING: 'Pending',
  PROCESSING: 'On its way',
  PAID: 'Paid',
  COMPLETED: 'Landed',
  FAILED: 'Failed',
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
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Cash out"
          description="Move your balance into your own bank account, in your own currency. Request it whenever the amount is worth moving — there is no schedule to wait for."
        />
        <WithdrawalsClient balances={balances} payoutCurrency={creator?.payoutCurrency ?? 'USD'} />
      </div>

      {balances.length > 1 && (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
          {balances.map((b) => (
            <div key={b.currency} className="bg-bg-elevated p-5">
              <dt className="text-sm font-semibold text-fg-muted">{b.currency}</dt>
              <dd className="tabular font-display mt-1 text-xl text-fg">
                {formatMoney(b.availableBalance, b.currency)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="font-display text-lg text-fg">No withdrawals yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">
              Once you request one, you will see it here moving from requested to landed, with the
              date it arrived.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg text-fg">Withdrawal history</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Withdrawal history">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Currency
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Requested
                  </th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border-light last:border-0">
                    <td className="tabular px-4 py-3 font-semibold text-fg sm:px-6">
                      {formatMoney(w.amount, w.currency)}
                    </td>
                    <td className="px-4 py-3 text-fg-muted sm:px-6">{w.currency}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <Badge variant={statusVariant(w.status)}>
                        {statusLabel[w.status] ?? w.status}
                      </Badge>
                      {w.status === 'FAILED' && (w.errorMessage || w.failureReason) && (
                        <span className="mt-1 block text-xs text-error">
                          {w.errorMessage || w.failureReason}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fg-muted sm:px-6">{formatDate(w.createdAt)}</td>
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
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <CardSkeleton />
        </div>
      }
    >
      <WithdrawalsContent />
    </Suspense>
  )
}
