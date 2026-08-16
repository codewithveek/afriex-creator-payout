'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  token: string
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const newPassword = form.get('password') as string
    const confirm = form.get('confirm') as string

    if (newPassword !== confirm) {
      setError('Those two passwords don’t match.')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Use at least 8 characters.')
      setLoading(false)
      return
    }

    try {
      await api.post('/api/auth/reset-password', { newPassword, token })
      router.push('/login')
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t reset your password. The link may have expired.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="display-md text-fg">Set a new password</h1>
      <p className="mt-2 text-fg-muted">
        Pick something you haven&apos;t used elsewhere. This account can move money.
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
        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
        />
        <Input
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
        />
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Save new password
        </Button>
      </form>
    </div>
  )
}
