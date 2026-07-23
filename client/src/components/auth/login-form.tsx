'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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
      await api.post('/api/auth/login', { email, password })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-[var(--shadow-lift)]">
      <CardHeader>
        <Link href="/" className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-bold text-fg-on-accent">
            AC
          </span>
          <span className="text-sm font-semibold text-fg">Afriex Creators</span>
        </Link>
        <h1 className="text-xl font-semibold text-fg">Creator sign in</h1>
        <p className="text-sm text-fg-muted">Access your dashboard, products, and Afriex payouts</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-error-muted p-3 text-sm text-error" role="alert">
              {error}
            </div>
          )}
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input label="Password" name="password" type="password" autoComplete="current-password" required />
          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-accent hover:text-accent-hover">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
          <p className="text-center text-sm text-fg-muted">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-accent hover:text-accent-hover">
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
