import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = {
  title: 'Reset your password',
}

export default async function ForgotPasswordPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <AuthShell
      pitch="Happens to everyone. Let us get you back in."
      points={[
        'The reset link goes to the email on your account',
        'It expires quickly, so open it soon',
        'Your products and balance are untouched',
      ]}
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
