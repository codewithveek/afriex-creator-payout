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
  const [methods] = useState(initial)
  const [showForm, setShowForm] = useState(false)
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

  return (
    <>
      {methods.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-sm text-gray-500">
              No payout methods yet. Add a bank account to receive payouts.
            </p>
            <Button onClick={() => setShowForm(true)}>Add payout method</Button>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Add Payout Method</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}
              <Input label="Account Number" name="accountNumber" required />
              <Input label="Bank Code" name="bankCode" required />
              <Input label="Bank Name" name="bankName" required />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="currency">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      )}

      {methods.length > 0 && (
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add payout method'}
        </Button>
      )}
    </>
  )
}
