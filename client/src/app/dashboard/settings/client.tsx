'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CountrySelect } from '@/components/ui/country-select'
import { PageHeader } from '@/components/dashboard/page-header'

/** Payout currencies. Products are always priced in USD; payouts convert to this. */
const payoutCurrencies = ['USD', 'NGN', 'GHS', 'KES'] as const

interface Props {
  creator: {
    phone: string
    country: string
    payoutCurrency: string
  }
}

export function SettingsClient({ creator }: Props) {
  const router = useRouter()
  const [phone, setPhone] = useState(creator.phone)
  const [country, setCountry] = useState(creator.country)
  const [payoutCurrency, setPayoutCurrency] = useState(creator.payoutCurrency)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.patch('/api/creators/me', { phone, country, payoutCurrency })
      setSuccess('Saved. Your next withdrawal uses these details.')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t save that. Check the details and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <PageHeader
        title="Settings"
        description="Your contact details and the currency your earnings are paid out in."
      />

      {error && (
        <div
          className="rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-lg border border-success/30 bg-success-muted p-3 text-sm font-medium text-success"
          role="status"
        >
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg text-fg">Your details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="+2348012345678"
              required
              hint="Used to confirm it’s really you before money moves."
            />
            <CountrySelect value={country} onChange={setCountry} required />

            <Select
              label="Pay me in"
              id="payoutCurrency"
              value={payoutCurrency}
              onChange={(e) => setPayoutCurrency(e.target.value)}
              hint="Your products sell in US dollars. Withdrawals arrive in this currency."
            >
              {payoutCurrencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Button type="submit" size="lg" loading={loading}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
