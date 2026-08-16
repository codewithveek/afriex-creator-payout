'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t send that email. Try again in a moment.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-muted text-success">
          <MailCheck className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="display-md mt-5 text-fg">Check your inbox</h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          If an account uses that email, a reset link is on its way. It expires shortly.
        </p>
        <Button href="/login" variant="outline" size="lg" className="mt-7 w-full">
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="display-md text-fg">Reset your password</h1>
      <p className="mt-2 text-fg-muted">
        Enter the email on your account and we&apos;ll send you a reset link.
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
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Send the reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
