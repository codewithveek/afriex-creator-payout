'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700',
    PROCESSING: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-green-50 text-green-700',
    FAILED: 'bg-red-50 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          {sweepResult && (
            <p className={`text-sm ${sweepResult.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
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

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {tab === 'creators' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Creators ({creators.length})</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Balance</th>
                  <th className="px-6 py-3 font-medium">Currency</th>
                  <th className="px-6 py-3 font-medium">Eligible</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.user.name}</td>
                    <td className="px-6 py-3 text-gray-700">{c.user.email}</td>
                    <td className="px-6 py-3 text-gray-900">${Number.parseFloat(c.availableBalance).toFixed(2)}</td>
                    <td className="px-6 py-3 text-gray-700">{c.payoutCurrency}</td>
                    <td className="px-6 py-3">
                      {c.payoutEligible ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {creators.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
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
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Withdrawals ({withdrawals.length})</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Currency</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Error</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">${Number.parseFloat(w.amount).toFixed(2)}</td>
                    <td className="px-6 py-3 text-gray-700">{w.currency}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[w.status] || 'bg-gray-50 text-gray-700'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{w.errorMessage || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {withdrawals.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
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
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Sales ({sales.length})</h2>
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
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">${Number.parseFloat(s.amount).toFixed(2)}</td>
                    <td className="px-6 py-3 text-gray-700">{s.currency}</td>
                    <td className="px-6 py-3 text-gray-700">{s.description || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {sales.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
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
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Pool Accounts ({pools.length})</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Currency</th>
                  <th className="px-6 py-3 font-medium">Balance</th>
                  <th className="px-6 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">{p.currency}</td>
                    <td className="px-6 py-3 text-gray-900">${Number.parseFloat(p.balance).toFixed(2)}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {pools.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                      No pool accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
