import { getSession } from '@/lib/auth'
import { SiteHeader } from './site-header'
import { SiteFooter } from './site-footer'

/**
 * Server component: resolves the session once per request so the header and
 * footer render the right account state in the very first HTML. Pages that need
 * client hooks should stay server components and put the interactive part in a
 * child (see `app/orders`).
 */
export async function MarketingShell({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={session} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter session={session} />
    </div>
  )
}
