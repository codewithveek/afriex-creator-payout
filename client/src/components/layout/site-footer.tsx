import Link from 'next/link'

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/store', label: 'Browse store' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/signup', label: 'Create account' },
    ],
  },
  {
    title: 'Creators',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/products', label: 'Your products' },
      { href: '/dashboard/withdrawals', label: 'Withdrawals' },
      { href: '/dashboard/payout-methods', label: 'Payout methods' },
    ],
  },
  {
    title: 'Buyers',
    links: [
      { href: '/customer/orders', label: 'Your orders' },
      { href: '/store', label: 'Digital products' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of service' },
      { href: '/privacy', label: 'Privacy policy' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-bold text-fg-on-accent">
                AC
              </span>
              <span className="font-semibold text-fg">Afriex Creators</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              Sell digital products and get paid across Africa. Buyers pay with Paystack,
              Flutterwave, or Afriex Checkout. Creators withdraw through Afriex.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Afriex Creators. All rights reserved.</p>
          <p>Payouts powered by Afriex · Payments via Paystack, Flutterwave & Afriex Checkout</p>
        </div>
      </div>
    </footer>
  )
}
