import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { safeNextPath } from '@/lib/next-path'
import { LoginForm } from '@/components/auth/login-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Check your sales, publish products, and withdraw your earnings.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const destination = safeNextPath(next, '/dashboard')

  const session = await getSession()
  if (session) redirect(destination)

  return (
    <AuthShell
      pitch="Your shop kept selling while you were away."
      points={[
        'Everything you’ve bought, ready to download again',
        'See what sold and what it earned',
        'Move your balance to your own bank account',
      ]}
    >
      <LoginForm next={destination} />
    </AuthShell>
  )
}
