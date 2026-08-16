'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      await api.post('/api/auth/sign-in/email', { email, password })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t sign you in. Check your email and password.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="display-md text-fg">Welcome back</h1>
      <p className="mt-2 text-fg-muted">Your shop, your sales, and your balance.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div
            className="rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
            role="alert"
          >
            {error}
          </div>
        )}
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="rounded text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        No shop yet?{' '}
        <Link href="/signup" className="font-semibold text-accent underline-offset-4 hover:underline">
          Open one free
        </Link>
      </p>
    </div>
  )
}
