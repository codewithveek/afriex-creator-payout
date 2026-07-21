import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-fg">Afriex Creator Payout</h1>
        <p className="mt-3 text-lg text-fg-muted">
          Sell digital products and get paid across Africa
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/store"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-fg-on-accent hover:bg-accent-hover transition-colors"
          >
            Browse Store
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border bg-bg px-6 py-3 text-sm font-medium text-fg-muted hover:bg-bg-muted transition-colors"
          >
            Creator Login
          </Link>
        </div>
      </div>
    </div>
  )
}
