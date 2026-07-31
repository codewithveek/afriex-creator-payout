'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { formatMoney } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { CreatorBalance } from '@/lib/types'

interface Props {
  balances: CreatorBalance[]
  payoutCurrency: string
}

export function WithdrawalsClient({ balances, payoutCurrency }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currency, setCurrency] = useState(payoutCurrency)
  const [amount, setAmount] = useState('')
  const [confirming, setConfirming] = useState(false)

  const selected = balances.find((b) => b.currency === currency)
  const available = selected?.availableBalance ?? '0.00'
  const availableNum = Number(available)
  const withdrawAmount = amount.trim() ? amount.trim() : available

  function handleReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const num = Number(withdrawAmount)
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (num > availableNum) {
      setError(`You can withdraw up to ${formatMoney(available, currency)}.`)
      return
    }
    setConfirming(true)
  }

  async function confirmWithdrawal() {
    setLoading(true)
    setError('')
    try {
      await api.post('/api/withdrawals/request', {
        ...(amount.trim() ? { amount: amount.trim() } : {}),
        currency,
      })
      setConfirming(false)
      setAmount('')
      setSuccess(
        `Withdrawal of ${formatMoney(withdrawAmount, currency)} requested. You can track it below.`,
      )
      router.refresh()
    } catch (err) {
      setConfirming(false)
      setError(err instanceof ApiClientError ? err.message : 'Failed to request withdrawal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-bg-elevated p-4 shadow-card">
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
      {confirming ? (
        <div className="space-y-3 rounded-lg border border-border bg-bg p-3">
          <p className="text-sm text-fg">
            Withdraw{' '}
            <span className="font-semibold">{formatMoney(withdrawAmount, currency)}</span> to your
            default payout method?
          </p>
          <div className="flex gap-3">
            <Button onClick={confirmWithdrawal} loading={loading}>
              Confirm withdrawal
            </Button>
            <Button variant="outline" disabled={loading} onClick={() => setConfirming(false)}>
              Go back
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReview} className="flex flex-col gap-3">
          {balances.length > 0 && (
            <Select
              label="Currency"
              id="withdraw-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {balances.map((b) => (
                <option key={b.currency} value={b.currency}>
                  {b.currency} · {formatMoney(b.availableBalance, b.currency)}
                </option>
              ))}
            </Select>
          )}
          <div className="space-y-1">
            <Input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={availableNum > 0 ? available : undefined}
              label="Amount"
              placeholder="Full balance"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-fg-subtle">Leave blank to withdraw your full balance.</p>
          </div>
          <Button type="submit" disabled={availableNum <= 0}>
            Review withdrawal
          </Button>
        </form>
      )}
      {success && (
        <p className="text-sm text-success" role="status">
          {success}
        </p>
      )}
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
