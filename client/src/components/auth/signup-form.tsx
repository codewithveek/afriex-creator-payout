'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      await api.post('/api/auth/signup', { name, email, password })
      await api.post('/api/onboarding/provision-creator')
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
        <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
        <p className="text-sm text-gray-500">Sign up to start managing your payouts</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          <Input label="Full name" name="name" type="text" autoComplete="name" required />
          <Input label="Email" name="email" type="email" autoComplete="email" required />
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
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
