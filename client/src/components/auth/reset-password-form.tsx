'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      await api.post('/api/auth/reset-password', { newPassword, token })
      router.push('/login')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold text-gray-900">Reset password</h1>
        <p className="text-sm text-gray-500">Enter your new password</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          <Input label="New Password" name="password" type="password" autoComplete="new-password" required />
          <Input label="Confirm Password" name="confirm" type="password" autoComplete="new-password" required />
          <Button type="submit" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
