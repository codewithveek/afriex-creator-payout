'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CountrySelect } from '@/components/ui/country-select'

export function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [country, setCountry] = useState('NG')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const email = form.get('email') as string
    const password = form.get('password') as string
    const phone = form.get('phone') as string

    if (!phone) {
      setError('We need a phone number to keep your account and payouts secure.')
      setLoading(false)
      return
    }

    try {
      await api.post('/api/auth/signup', { name, email, password })
      await api.post('/api/onboarding/provision-creator', { phone, country })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We could not create your account. Try again in a moment.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="display-md text-fg">Open your shop</h1>
      <p className="mt-2 text-fg-muted">
        Free to start. You keep 90% of every sale, and there is nothing to pay until you make one.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div
            className="rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
            role="alert"
          >
            {error}
          </div>
        )}
        <Input label="Full name" name="name" type="text" autoComplete="name" required />
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Input
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+2348012345678"
          required
          hint="Used to verify it is really you before money moves."
        />
        <CountrySelect value={country} onChange={setCountry} required />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
        />
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create my shop
        </Button>
        <p className="text-center text-xs leading-relaxed text-fg-muted">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="font-semibold text-accent underline-offset-4 hover:underline">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="font-semibold text-accent underline-offset-4 hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Already selling here?{' '}
        <Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
