import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { SignupForm } from '@/components/auth/signup-form'

export default async function SignupPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <SignupForm />
    </div>
  )
}
