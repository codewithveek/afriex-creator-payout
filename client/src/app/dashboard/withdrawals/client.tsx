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
      setSuccess(`${formatMoney(withdrawAmount, currency)} is on its way to your bank.`)
      router.refresh()
    } catch (err) {
      setConfirming(false)
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t start that withdrawal. Try again shortly.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-5 shadow-card">
      <p className="text-sm font-semibold text-fg-muted">Ready to move</p>
      <p className="tabular font-display mt-1 text-3xl text-fg">
        {formatMoney(available, currency)}
      </p>

      {balances.length > 1 && (
        <p className="mt-2 text-xs leading-relaxed text-fg-muted">
          Each currency keeps its own balance. Withdraw into a matching bank account.
        </p>
      )}

      {confirming ? (
        <div className="mt-5 space-y-4 rounded-xl border border-accent/30 bg-accent-muted/40 p-4">
          <p className="text-sm leading-relaxed text-fg">
            Send <span className="tabular font-semibold">{formatMoney(withdrawAmount, currency)}</span>{' '}
            to your default bank account?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={confirmWithdrawal} loading={loading}>
              Yes, send it
            </Button>
            <Button variant="outline" disabled={loading} onClick={() => setConfirming(false)}>
              Not yet
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReview} className="mt-5 flex flex-col gap-4">
          {balances.length > 1 && (
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
          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={availableNum > 0 ? available : undefined}
            label="How much?"
            placeholder="Whole balance"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint="Leave it blank to move everything."
          />
          <Button type="submit" size="lg" disabled={availableNum <= 0}>
            Review withdrawal
          </Button>
          {availableNum <= 0 && (
            <p className="text-xs text-fg-muted">
              Nothing to withdraw yet. Your balance grows as sales come in.
            </p>
          )}
        </form>
      )}

      {success && (
        <p
          className="mt-4 rounded-lg bg-success-muted p-3 text-sm font-medium text-success"
          role="status"
        >
          {success}
        </p>
      )}
      {error && (
        <p
          className="mt-4 rounded-lg bg-error-muted p-3 text-sm font-medium text-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
