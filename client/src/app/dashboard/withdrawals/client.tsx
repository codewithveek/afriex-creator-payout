'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { formatMoney } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CreatorBalance } from '@/lib/types'

interface Props {
  balances: CreatorBalance[]
  payoutCurrency: string
}

export function WithdrawalsClient({ balances, payoutCurrency }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currency, setCurrency] = useState(payoutCurrency)

  const selected = balances.find((b) => b.currency === currency)
  const available = selected?.availableBalance ?? '0.00'

  async function requestWithdrawal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const amount = (form.get('amount') as string)?.trim()

    try {
      await api.post('/api/withdrawals/request', {
        ...(amount ? { amount } : {}),
        currency,
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to request withdrawal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-bg-elevated p-4 shadow-[var(--shadow-card)]">
      <p className="text-sm text-fg-muted">
        Available in {currency}:{' '}
        <span className="font-semibold text-fg">{formatMoney(available, currency)}</span>
      </p>
      {balances.length > 1 && (
        <p className="text-xs text-fg-subtle">
          Earnings are kept per currency. Withdraw only from a currency that matches your verified
          payout method.
        </p>
      )}
      <form onSubmit={requestWithdrawal} className="flex flex-col gap-3">
        {balances.length > 0 && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-fg-muted" htmlFor="withdraw-currency">
              Currency
            </label>
            <select
              id="withdraw-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="block w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {balances.map((b) => (
                <option key={b.currency} value={b.currency}>
                  {b.currency} · {formatMoney(b.availableBalance, b.currency)}
                </option>
              ))}
            </select>
          </div>
        )}
        <Input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          label="Amount (optional — leave blank for full balance)"
          placeholder="Full balance"
        />
        <Button type="submit" loading={loading}>
          Request Afriex payout
        </Button>
      </form>
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
