import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default async function ForgotPasswordPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-muted px-4">
      <ForgotPasswordForm />
    </div>
  )
}
