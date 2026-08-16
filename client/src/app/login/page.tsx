import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { LoginForm } from '@/components/auth/login-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Check your sales, publish products, and withdraw your earnings.',
}

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <AuthShell
      pitch="Your shop kept selling while you were away."
      points={[
        'See what sold and what it earned',
        'Publish a new product in minutes',
        'Move your balance to your own bank account',
      ]}
    >
      <LoginForm />
    </AuthShell>
  )
}
