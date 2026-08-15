import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = {
  title: 'Set a new password',
}

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  const session = await getSession()
  if (session) redirect('/dashboard')

  if (!token) {
    redirect('/forgot-password')
  }

  return (
    <AuthShell
      pitch="One password stands between your work and your earnings."
      points={[
        'Use something you have not used on another site',
        'Your bank details stay encrypted either way',
        'You will be signed out everywhere else',
      ]}
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}
