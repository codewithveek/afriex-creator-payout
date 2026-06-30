'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
        <p className="text-sm text-gray-500">Enter your credentials to access your account</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input label="Password" name="password" type="password" autoComplete="current-password" required />
          <div className="flex items-center justify-end">
            <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Forgot password?
            </a>
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
