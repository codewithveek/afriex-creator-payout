'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
      setError('Phone number is required')
      setLoading(false)
      return
    }

    try {
      await api.post('/api/auth/signup', { name, email, password })
      await api.post('/api/onboarding/provision-creator', { phone, country })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold text-fg">Create account</h1>
        <p className="text-sm text-fg-muted">Sign up to start managing your payouts</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-error-muted p-3 text-sm text-error" role="alert">
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
          />
          <CountrySelect value={country} onChange={setCountry} required />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
          <p className="text-center text-sm text-fg-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
