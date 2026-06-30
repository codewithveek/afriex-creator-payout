import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar role={session.user.role} />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="mx-auto max-w-7xl p-8">{children}</div>
      </main>
    </div>
  )
}
