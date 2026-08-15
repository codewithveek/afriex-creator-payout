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
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar role={session?.user?.role} />
      <main id="main-content" className="flex-1 overflow-x-hidden bg-bg-muted">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">{children}</div>
      </main>
    </div>
  )
}
