'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CountrySelect } from '@/components/ui/country-select'

const currencies = ['USD', 'NGN', 'GHS', 'KES'] as const

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
      setSuccess('Settings saved')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-fg">Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">Manage your profile and payout preferences</p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-muted p-3 text-sm text-error" role="alert">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-success-muted p-3 text-sm text-success" role="status">{success}</div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-fg">Profile</h2>
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
            />
            <CountrySelect value={country} onChange={setCountry} required />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-fg-muted" htmlFor="payoutCurrency">
                Default payout currency
              </label>
              <select
                id="payoutCurrency"
                value={payoutCurrency}
                onChange={(e) => setPayoutCurrency(e.target.value)}
                className="block w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-xs text-fg-subtle">
                This determines the currency used for payouts. Ensure you have a payout method in this currency.
              </p>
            </div>

            <Button type="submit" loading={loading}>
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
