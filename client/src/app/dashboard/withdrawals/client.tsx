'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  balance: string | null
}

export function WithdrawalsClient({ balance }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function requestWithdrawal(form: FormData) {
    setLoading(true)
    setError('')

    const amount = form.get('amount') as string

    try {
      await api.post('/api/withdrawals/request', amount ? { amount } : undefined)
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to request withdrawal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-3">
      {balance !== null && (
        <p className="text-sm text-gray-500">
          Available balance: <span className="font-semibold text-gray-900">${Number.parseFloat(balance).toFixed(2)}</span>
        </p>
      )}
      <form action={requestWithdrawal} className="flex items-end gap-3">
        <Input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount (optional)"
          className="w-48"
        />
        <Button type="submit" loading={loading}>
          Request withdrawal
        </Button>
      </form>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
