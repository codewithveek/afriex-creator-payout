import Link from 'next/link'
import type { Session } from '@/lib/types'
import { Logo } from './logo'

const buyColumn = {
  title: 'Buy',
  links: [
    { href: '/discover', label: 'Browse everything' },
    { href: '/orders', label: 'Your orders & downloads' },
    { href: '/how-it-works', label: 'How buying works' },
  ],
}

const companyColumn = {
  title: 'Company',
  links: [
    { href: '/how-it-works', label: 'How it works' },
    { href: '/terms', label: 'Terms of service' },
    { href: '/privacy', label: 'Privacy policy' },
  ],
}

/** Signed-in creators don't need "open a shop"; visitors can't use the dashboard. */
function sellColumn(signedIn: boolean) {
  return {
    title: 'Sell',
    links: signedIn
      ? [
          { href: '/dashboard', label: 'Your dashboard' },
          { href: '/dashboard/products', label: 'Your products' },
          { href: '/dashboard/withdrawals', label: 'Cash out' },
          { href: '/pricing', label: 'What it costs' },
        ]
      : [
          { href: '/signup', label: 'Open your shop' },
          { href: '/pricing', label: 'What it costs' },
          { href: '/login', label: 'Creator log in' },
        ],
  }
}

export function SiteFooter({ session = null }: { session?: Session | null }) {
  const columns = [buyColumn, sellColumn(Boolean(session?.user)), companyColumn]

  return (
    <footer className="border-t border-border-inverse bg-bg-inverse text-fg-on-inverse">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="on-ink mt-4 max-w-xs text-sm text-fg-on-inverse-muted">
              A marketplace for digital products. Buy something useful in two taps, or turn what you
              know into an income.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-display text-sm text-fg-on-inverse">{col.title}</p>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-fg-on-inverse-muted underline-offset-4 transition-colors hover:text-fg-on-inverse hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border-inverse pt-6 text-xs text-fg-on-inverse-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Afriex Creators. All rights reserved.</p>
          <p>Instant delivery · Payouts to your local bank account</p>
        </div>
      </div>
    </footer>
  )
}
