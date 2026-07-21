'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { PayoutMethod } from '@/lib/types'

const currencies = ['USD', 'NGN', 'GHS', 'KES'] as const

interface Props {
  initial: PayoutMethod[]
}

export function PayoutMethodsClient({ initial }: Props) {
  const router = useRouter()
  const [methods, setMethods] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      await api.post('/api/payout-methods', {
        accountNumber: form.get('accountNumber'),
        bankCode: form.get('bankCode'),
        bankName: form.get('bankName'),
        currency: form.get('currency'),
      })
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add payout method')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    setError('')
    try {
      await api.delete(`/api/payout-methods/${id}`)
      setMethods((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete payout method')
    } finally {
      setDeleting(null)
    }
  }

  const formContent = (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-fg">Add Payout Method</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-error-muted p-3 text-sm text-error" role="alert">
              {error}
            </div>
          )}
          <Input label="Account Number" name="accountNumber" required />
          <Input label="Bank Code" name="bankCode" required />
          <Input label="Bank Name" name="bankName" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-fg-muted" htmlFor="currency">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              className="block w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              required
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {methods.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-sm text-fg-muted">
              No payout methods yet. Add a bank account to receive payouts.
            </p>
            <Button onClick={() => setShowForm(true)}>Add payout method</Button>
          </CardContent>
        </Card>
      )}

      {showForm && formContent}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {methods.length > 0 && (
          <Button onClick={() => { setShowForm(!showForm); setError('') }}>
            {showForm ? 'Cancel' : 'Add payout method'}
          </Button>
        )}
      </div>

      {methods.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">Saved Accounts</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Saved payout methods">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th className="px-4 sm:px-6 py-3 font-medium">Bank</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Currency</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Default</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Added</th>
                  <th className="px-4 sm:px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id} className="border-b border-border-light last:border-0">
                    <td className="px-4 sm:px-6 py-3 text-fg">
                      {(method.details as { bankName?: string })?.bankName || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-fg-muted">{method.currency}</td>
                    <td className="px-4 sm:px-6 py-3">
                      {method.isDefault ? (
                        <span className="inline-flex items-center rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
                          Default
                        </span>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-fg-subtle">
                      {new Date(method.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deleting === method.id}
                        onClick={() => handleDelete(method.id)}
                      >
                        Delete
                      </Button>
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
