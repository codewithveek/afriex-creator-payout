'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { BadgeCheck, Landmark, Smartphone } from 'lucide-react'
import { ApiClientError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/queries/keys'
import {
  fetchInstitutions,
  resolveAccount,
  addPayoutMethod,
  type PayoutChannel,
} from '@/lib/queries/payout-methods'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/** Payout currencies. Products are always priced in USD; payouts convert to this. */
const payoutCurrencies = ['USD', 'NGN', 'GHS', 'KES'] as const

const channelCopy: Record<
  PayoutChannel,
  { label: string; icon: typeof Landmark; institutionLabel: string; accountLabel: string; accountHint: string; placeholder: string }
> = {
  BANK_ACCOUNT: {
    label: 'Bank account',
    icon: Landmark,
    institutionLabel: 'Choose your bank',
    accountLabel: 'Account number',
    accountHint: 'The account number as it appears on your statement.',
    placeholder: '0123456789',
  },
  MOBILE_MONEY: {
    label: 'Mobile money',
    icon: Smartphone,
    institutionLabel: 'Choose your provider',
    accountLabel: 'Mobile money number',
    accountHint: 'The number your mobile money wallet is registered to.',
    placeholder: '024 123 4567',
  },
}

interface Props {
  onSaved: () => void
  onCancel: () => void
}

export function AddAccountForm({ onSaved, onCancel }: Props) {
  const [channel, setChannel] = useState<PayoutChannel>('BANK_ACCOUNT')
  const [institutionCode, setInstitutionCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [currency, setCurrency] = useState<string>('USD')
  const [error, setError] = useState('')

  const bankInstitutions = useQuery({
    queryKey: queryKeys.institutions('BANK_ACCOUNT'),
    queryFn: () => fetchInstitutions('BANK_ACCOUNT'),
    staleTime: 30 * 60 * 1000,
  })

  const momoInstitutions = useQuery({
    queryKey: queryKeys.institutions('MOBILE_MONEY'),
    queryFn: () => fetchInstitutions('MOBILE_MONEY'),
    staleTime: 30 * 60 * 1000,
  })

  const activeQuery = channel === 'BANK_ACCOUNT' ? bankInstitutions : momoInstitutions

  // Mobile money only appears where the creator's own country supports it.
  const mobileMoneyAvailable = (momoInstitutions.data?.length ?? 0) > 0

  /**
   * A verification is only good for the exact details it was run against.
   * Changing the bank or a single digit invalidates it, so the confirmed name
   * on screen can never belong to a different account than the one being saved.
   */
  const verificationKey = `${channel}|${institutionCode}|${accountNumber.trim()}`
  const [verified, setVerified] = useState<{ key: string; accountName: string | null } | null>(null)
  const isVerified = verified?.key === verificationKey

  const canVerify = Boolean(institutionCode) && accountNumber.trim().length >= 6

  const resolveMutation = useMutation({
    mutationFn: () =>
      resolveAccount({ channel, institutionCode, accountNumber: accountNumber.trim() }),
    onSuccess: (data) => {
      setError('')
      setVerified({ key: verificationKey, accountName: data.accountName })
    },
    onError: (err) => {
      setVerified(null)
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t confirm that account. Check the number and try again.',
      )
    },
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      addPayoutMethod({
        channel,
        institutionCode,
        accountNumber: accountNumber.trim(),
        currency,
      }),
    onSuccess: onSaved,
    onError: (err) => {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t save that account. Check the details and try again.',
      )
    },
  })

  const copy = channelCopy[channel]
  const institutionsError =
    activeQuery.error instanceof ApiClientError
      ? activeQuery.error.message
      : activeQuery.isError
        ? 'We couldn’t load the list of institutions. Try again in a moment.'
        : ''

  const sortedInstitutions = useMemo(
    () => [...(activeQuery.data ?? [])].sort((a, b) => a.institutionName.localeCompare(b.institutionName)),
    [activeQuery.data],
  )

  function reset(next: Partial<{ channel: PayoutChannel; institutionCode: string }>) {
    if (next.channel) {
      setChannel(next.channel)
      setInstitutionCode('')
    }
    if (next.institutionCode !== undefined) setInstitutionCode(next.institutionCode)
    setVerified(null)
    setError('')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isVerified) {
      resolveMutation.mutate()
      return
    }
    saveMutation.mutate()
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg text-fg">Add a payout account</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Use an account in your own name. It&apos;s stored encrypted and never shown to buyers.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-md space-y-5">
          {error && (
            <div
              className="rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {mobileMoneyAvailable && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-fg">Where should we send it?</legend>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(channelCopy) as PayoutChannel[]).map((key) => {
                  const option = channelCopy[key]
                  const Icon = option.icon
                  const active = channel === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => reset({ channel: key })}
                      aria-pressed={active}
                      className={cn(
                        'flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors duration-150',
                        active
                          ? 'border-accent bg-accent-muted text-accent-deep'
                          : 'border-border bg-bg-elevated text-fg-muted hover:border-fg-subtle hover:text-fg',
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}

          <Select
            label={copy.institutionLabel}
            id="institutionCode"
            name="institutionCode"
            required
            value={institutionCode}
            disabled={activeQuery.isLoading || sortedInstitutions.length === 0}
            onChange={(e) => reset({ institutionCode: e.target.value })}
            error={institutionsError || undefined}
            hint={
              activeQuery.isLoading
                ? 'Loading…'
                : 'We fill in the institution details from your choice.'
            }
          >
            <option value="" disabled>
              {activeQuery.isLoading ? 'Loading…' : 'Select one'}
            </option>
            {sortedInstitutions.map((institution) => (
              <option key={institution.institutionId} value={institution.institutionCode}>
                {institution.institutionName}
              </option>
            ))}
          </Select>

          <Input
            label={copy.accountLabel}
            name="accountNumber"
            inputMode="numeric"
            autoComplete="off"
            required
            placeholder={copy.placeholder}
            value={accountNumber}
            hint={copy.accountHint}
            onChange={(e) => {
              setAccountNumber(e.target.value)
              setVerified(null)
              setError('')
            }}
          />

          {isVerified && (
            <div className="flex gap-3 rounded-lg border border-success/30 bg-success-muted p-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-success">
                  {verified?.accountName ?? 'Account found'}
                </p>
                <p className="mt-0.5 text-sm text-fg-muted">
                  {verified?.accountName
                    ? 'Check the name matches yours before saving.'
                    : 'The account exists, but no name came back for it.'}
                </p>
              </div>
            </div>
          )}

          <Select
            label="Pay me in"
            id="currency"
            name="currency"
            required
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            hint="Your products sell in US dollars. Withdrawals arrive in this currency."
          >
            {payoutCurrencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <div className="flex flex-wrap gap-3">
            {isVerified ? (
              <Button type="submit" size="lg" loading={saveMutation.isPending}>
                Save this account
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                disabled={!canVerify}
                loading={resolveMutation.isPending}
              >
                Verify account
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          {!isVerified && resolveMutation.isError && (
            <div className="border-t border-border-light pt-4">
              <p className="text-sm text-fg-muted">
                Some accounts can&apos;t be confirmed automatically. You can save it anyway, but
                withdrawals stay on hold until it&apos;s verified.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                Save without verifying
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
