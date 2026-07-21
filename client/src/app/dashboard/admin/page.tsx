'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Tab = 'creators' | 'withdrawals' | 'sales' | 'pool-accounts'

interface Creator {
  id: string
  user: { name: string; email: string; role: string }
  availableBalance: string
  payoutCurrency: string
  payoutEligible: boolean
  createdAt: string
}

interface Withdrawal {
  id: string
  creatorId: string
  amount: string
  currency: string
  status: string
  errorMessage: string | null
  createdAt: string
}

interface Sale {
  id: string
  creatorId: string
  amount: string
  currency: string
  description: string | null
  createdAt: string
}

interface PoolAccount {
  id: string
  currency: string
  balance: string
  updatedAt: string
}

const tabs: { key: Tab; label: string }[] = [
  { key: 'creators', label: 'Creators' },
  { key: 'withdrawals', label: 'Withdrawals' },
  { key: 'sales', label: 'Sales' },
  { key: 'pool-accounts', label: 'Pool Accounts' },
]

const statusStyles: Record<string, string> = {
  PENDING: 'bg-warning-muted text-warning',
  PROCESSING: 'bg-info-muted text-info',
  COMPLETED: 'bg-success-muted text-success',
  FAILED: 'bg-error-muted text-error',
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('creators')
  const [creators, setCreators] = useState<Creator[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [pools, setPools] = useState<PoolAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sweepLoading, setSweepLoading] = useState(false)
  const [sweepResult, setSweepResult] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [creatorsResponse, withdrawalsResponse, salesResponse, poolsResponse] = await Promise.all([
        api.get<{ data: Creator[] }>('/api/admin/creators'),
        api.get<{ data: Withdrawal[] }>('/api/admin/withdrawals'),
        api.get<{ data: Sale[] }>('/api/admin/sales'),
        api.get<{ data: PoolAccount[] }>('/api/admin/pool-accounts'),
      ])
      setCreators(creatorsResponse.data)
      setWithdrawals(withdrawalsResponse.data)
      setSales(salesResponse.data)
      setPools(poolsResponse.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleTriggerSweep() {
    setSweepLoading(true)
    setSweepResult('')
    try {
      const res = await api.post<{ message: string }>('/api/admin/sweep/trigger')
      setSweepResult(res.message || 'Sweep triggered successfully')
      fetchData()
    } catch (err) {
      setSweepResult(err instanceof ApiClientError ? err.message : 'Failed to trigger sweep')
    } finally {
      setSweepLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Admin</h1>
          <p className="mt-1 text-sm text-fg-muted">Platform overview and management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {sweepResult && (
            <p className={`text-sm ${sweepResult.includes('Failed') ? 'text-error' : 'text-success'}`}>
              {sweepResult}
            </p>
          )}
          <Button variant="outline" onClick={handleTriggerSweep} loading={sweepLoading}>
            Trigger sweep
          </Button>
          <Button variant="secondary" onClick={fetchData} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div role="tablist" aria-label="Admin sections" className="flex gap-1 border-b border-border-light">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset ${
              tab === t.key
                ? 'border-b-2 border-accent text-accent'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-error-muted p-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {tab === 'creators' && (
            <Card key="creators" role="tabpanel" id="panel-creators" aria-labelledby="tab-creators">
              <CardHeader>
                <h2 className="text-lg font-semibold text-fg">Creators ({creators.length})</h2>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Creators">
                  <thead>
                    <tr className="border-b border-border-light text-left text-fg-muted">
                      <th className="px-4 sm:px-6 py-3 font-medium">Name</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Email</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Balance</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Currency</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Eligible</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creators.map((c) => (
                      <tr key={c.id} className="border-b border-border-light last:border-0">
                        <td className="px-4 sm:px-6 py-3 font-medium text-fg">{c.user.name}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg-muted">{c.user.email}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg">${Number.parseFloat(c.availableBalance).toFixed(2)}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg-muted">{c.payoutCurrency}</td>
                        <td className="px-4 sm:px-6 py-3">
                          {c.payoutEligible ? (
                            <span className="inline-flex items-center rounded-full bg-success-muted px-2 py-0.5 text-xs font-medium text-success">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-bg-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-fg-subtle">{new Date(c.createdAt).toLocaleDateString()}</td>
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
            <Card key="withdrawals" role="tabpanel" id="panel-withdrawals" aria-labelledby="tab-withdrawals">
              <CardHeader>
                <h2 className="text-lg font-semibold text-fg">Withdrawals ({withdrawals.length})</h2>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Withdrawals">
                  <thead>
                    <tr className="border-b border-border-light text-left text-fg-muted">
                      <th className="px-4 sm:px-6 py-3 font-medium">Amount</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Currency</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Status</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Error</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-border-light last:border-0">
                        <td className="px-4 sm:px-6 py-3 font-medium text-fg">${Number.parseFloat(w.amount).toFixed(2)}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg-muted">{w.currency}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[w.status] || 'bg-bg-muted text-fg-muted'}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-fg-subtle">{w.errorMessage || '—'}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg-subtle">{new Date(w.createdAt).toLocaleDateString()}</td>
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
            <Card key="sales" role="tabpanel" id="panel-sales" aria-labelledby="tab-sales">
              <CardHeader>
                <h2 className="text-lg font-semibold text-fg">Sales ({sales.length})</h2>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Sales">
                  <thead>
                    <tr className="border-b border-border-light text-left text-fg-muted">
                      <th className="px-4 sm:px-6 py-3 font-medium">Amount</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Currency</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Description</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id} className="border-b border-border-light last:border-0">
                        <td className="px-4 sm:px-6 py-3 font-medium text-fg">${Number.parseFloat(s.amount).toFixed(2)}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg-muted">{s.currency}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg-muted">{s.description || '—'}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg-subtle">{new Date(s.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
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
            <Card key="pool-accounts" role="tabpanel" id="panel-pool-accounts" aria-labelledby="tab-pool-accounts">
              <CardHeader>
                <h2 className="text-lg font-semibold text-fg">Pool Accounts ({pools.length})</h2>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Pool accounts">
                  <thead>
                    <tr className="border-b border-border-light text-left text-fg-muted">
                      <th className="px-4 sm:px-6 py-3 font-medium">Currency</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Balance</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pools.map((p) => (
                      <tr key={p.id} className="border-b border-border-light last:border-0">
                        <td className="px-4 sm:px-6 py-3 font-medium text-fg">{p.currency}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg">${Number.parseFloat(p.balance).toFixed(2)}</td>
                        <td className="px-4 sm:px-6 py-3 text-fg-subtle">{new Date(p.updatedAt).toLocaleDateString()}</td>
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
