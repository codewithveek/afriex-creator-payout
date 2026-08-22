import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { safeNextPath } from '@/lib/next-path'
import { SignupForm } from '@/components/auth/signup-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = {
  title: 'Open your shop',
  description: 'Sell your templates, presets, courses or study packs. Free to open, a flat 10% per sale.',
}

export default async function SignupPage({
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
      pitch="Turn what you already made into income."
      points={[
        'Upload, price, share the link',
        'Buyers are charged, receipted, and sent their download automatically',
        'Withdraw to your own bank, in your local currency',
      ]}
    >
      <SignupForm next={destination} />
    </AuthShell>
  )
}
