import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { SignupForm } from '@/components/auth/signup-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = {
  title: 'Open your shop',
  description: 'Sell your templates, presets, courses or study packs. Free to open, a flat 10% per sale.',
}

export default async function SignupPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <AuthShell
      pitch="Turn what you already made into income."
      points={[
        'Upload, price, share the link',
        'Buyers are charged, receipted, and sent their download automatically',
        'Withdraw to your own bank account',
      ]}
    >
      <SignupForm />
    </AuthShell>
  )
}
