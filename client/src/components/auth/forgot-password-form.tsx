'use client'

import { useState } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string

    try {
      await api.post('/api/auth/request-password-reset', {
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="py-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
          <p className="mt-2 text-sm text-gray-500">
            If an account exists with that email, we&apos;ve sent a password reset link.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold text-gray-900">Forgot password</h1>
        <p className="text-sm text-gray-500">Enter your email to receive a reset link</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
          <p className="text-center text-sm text-gray-500">
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Back to sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
