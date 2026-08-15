'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/lib/api-client'
import { formatMoney, formatDate } from '@/lib/utils'
import { queryKeys } from '@/lib/queries/keys'
import {
  fetchAdminCreators,
  fetchAdminWithdrawals,
  fetchAdminSales,
  fetchAdminPoolAccounts,
  triggerAdminSweep,
} from '@/lib/queries/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'

type Tab = 'creators' | 'withdrawals' | 'sales' | 'pool-accounts'

const tabs: { key: Tab; label: string }[] = [
  { key: 'creators', label: 'Creators' },
  { key: 'withdrawals', label: 'Withdrawals' },
  { key: 'sales', label: 'Sales' },
  { key: 'pool-accounts', label: 'Pool Accounts' },
]

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (status === 'COMPLETED' || status === 'PAID') return 'success'
  if (status === 'PENDING' || status === 'QUEUED') return 'warning'
  if (status === 'PROCESSING') return 'info'
  if (status === 'FAILED') return 'error'
  return 'default'
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('creators')
  const queryClient = useQueryClient()

  const creatorsQuery = useQuery({
    queryKey: queryKeys.admin.creators,
    queryFn: fetchAdminCreators,
    enabled: tab === 'creators',
  })
  const withdrawalsQuery = useQuery({
    queryKey: queryKeys.admin.withdrawals,
    queryFn: fetchAdminWithdrawals,
    enabled: tab === 'withdrawals',
  })
  const salesQuery = useQuery({
    queryKey: queryKeys.admin.sales,
    queryFn: fetchAdminSales,
    enabled: tab === 'sales',
  })
  const poolsQuery = useQuery({
    queryKey: queryKeys.admin.poolAccounts,
    queryFn: fetchAdminPoolAccounts,
    enabled: tab === 'pool-accounts',
  })

  const queriesByTab = {
    creators: creatorsQuery,
    withdrawals: withdrawalsQuery,
    sales: salesQuery,
    'pool-accounts': poolsQuery,
  } as const
  const activeQuery = queriesByTab[tab]

  const loading = activeQuery.isLoading

  const error = activeQuery.error ?? null

  const errorMessage =
    error instanceof ApiClientError
      ? error.message
      : error
        ? 'We could not load that data. Try refreshing.'
        : ''

  const sweepMutation = useMutation({
    mutationFn: triggerAdminSweep,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all })
    },
  })

  function refreshAll() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all })
  }

  const creators = creatorsQuery.data ?? []
  const withdrawals = withdrawalsQuery.data ?? []
  const sales = salesQuery.data ?? []
  const pools = poolsQuery.data ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform"
        description="Read-only oversight of creators, sales, withdrawals, and pool balances."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => sweepMutation.mutate()}
              loading={sweepMutation.isPending}
            >
              Run sweep
            </Button>
            <Button variant="secondary" onClick={refreshAll} loading={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <div aria-live="polite">
        {sweepMutation.isSuccess && (
          <p className="rounded-lg bg-success-muted p-3 text-sm font-medium text-success">
            {sweepMutation.data?.message || 'Sweep triggered.'}
          </p>
        )}
        {sweepMutation.isError && (
          <p className="rounded-lg bg-error-muted p-3 text-sm font-medium text-error">
            {sweepMutation.error instanceof ApiClientError
              ? sweepMutation.error.message
              : 'The sweep could not be triggered.'}
          </p>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Admin sections"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div
          className="rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ) : (
        <>
          {tab === 'creators' && (
            <Card role="tabpanel" id="panel-creators" aria-labelledby="tab-creators">
              <CardHeader>
                <h2 className="font-display text-lg text-fg">Creators ({creators.length})</h2>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Creators">
                  <thead>
                    <tr className="border-b border-border-light text-left text-fg-muted">
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Name</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Email</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Balance</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Currency</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Eligible</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creators.map((c) => (
                      <tr key={c.id} className="border-b border-border-light last:border-0">
                        <td className="px-4 py-3 font-semibold text-fg sm:px-6">{c.user.name}</td>
                        <td className="px-4 py-3 text-fg-muted sm:px-6">{c.user.email}</td>
                        <td className="px-4 py-3 text-fg sm:px-6">
                          {formatMoney(c.availableBalance, c.payoutCurrency)}
                        </td>
                        <td className="px-4 py-3 text-fg-muted sm:px-6">{c.payoutCurrency}</td>
                        <td className="px-4 py-3 sm:px-6">
                          <Badge variant={c.payoutEligible ? 'success' : 'default'}>
                            {c.payoutEligible ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-fg-muted sm:px-6">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {creators.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-fg-muted">
                          No creators found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {tab === 'withdrawals' && (
            <Card role="tabpanel" id="panel-withdrawals" aria-labelledby="tab-withdrawals">
              <CardHeader>
                <h2 className="font-display text-lg text-fg">
                  Withdrawals ({withdrawals.length})
                </h2>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Withdrawals">
                  <thead>
                    <tr className="border-b border-border-light text-left text-fg-muted">
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Amount</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Currency</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Status</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Error</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Date</th>
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
                          <Badge variant={statusVariant(w.status)}>{w.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-fg-muted sm:px-6">
                          {w.errorMessage || '—'}
                        </td>
                        <td className="px-4 py-3 text-fg-muted sm:px-6">
                          {formatDate(w.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {withdrawals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-fg-muted">
                          No withdrawals found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {tab === 'sales' && (
            <Card role="tabpanel" id="panel-sales" aria-labelledby="tab-sales">
              <CardHeader>
                <h2 className="font-display text-lg text-fg">Sales ({sales.length})</h2>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Sales">
                  <thead>
                    <tr className="border-b border-border-light text-left text-fg-muted">
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Amount</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Currency</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Description</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => {
                      const amount = s.grossAmount ?? s.amount ?? '0'
                      return (
                        <tr key={s.id} className="border-b border-border-light last:border-0">
                          <td className="tabular px-4 py-3 font-semibold text-fg sm:px-6">
                            {formatMoney(amount, s.currency)}
                          </td>
                          <td className="px-4 py-3 text-fg-muted sm:px-6">{s.currency}</td>
                          <td className="px-4 py-3 text-fg-muted sm:px-6">
                            {s.description || '—'}
                          </td>
                          <td className="px-4 py-3 text-fg-muted sm:px-6">
                            {formatDate(s.createdAt)}
                          </td>
                        </tr>
                      )
                    })}
                    {sales.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-fg-muted">
                          No sales found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {tab === 'pool-accounts' && (
            <Card role="tabpanel" id="panel-pool-accounts" aria-labelledby="tab-pool-accounts">
              <CardHeader>
                <h2 className="font-display text-lg text-fg">
                  Pool Accounts ({pools.length})
                </h2>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Pool accounts">
                  <thead>
                    <tr className="border-b border-border-light text-left text-fg-muted">
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Currency</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Balance</th>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pools.map((p) => (
                      <tr key={p.id} className="border-b border-border-light last:border-0">
                        <td className="tabular px-4 py-3 font-semibold text-fg sm:px-6">{p.currency}</td>
                        <td className="px-4 py-3 text-fg sm:px-6">
                          {formatMoney(p.balance, p.currency)}
                        </td>
                        <td className="px-4 py-3 text-fg-muted sm:px-6">
                          {formatDate(p.updatedAt)}
                        </td>
                      </tr>
                    ))}
                    {pools.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-sm text-fg-muted">
                          No pool accounts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
