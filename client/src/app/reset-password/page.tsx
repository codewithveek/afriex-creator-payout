import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

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
    <div className="flex min-h-screen items-center justify-center bg-bg-muted px-4">
      <ResetPasswordForm token={token} />
    </div>
  )
}
