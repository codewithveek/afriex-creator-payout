import Link from 'next/link'
import { Logo } from '@/components/layout/logo'

interface Props {
  children: React.ReactNode
  /** Marketing panel headline, shown beside the form on large screens. */
  pitch: string
  points: string[]
}

export function AuthShell({ children, pitch, points }: Props) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-bg-inverse px-4 py-6 text-fg-on-inverse sm:px-6 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        <div className="ledger-lines absolute inset-0" aria-hidden />
        <div className="ink-glow absolute inset-0 hidden lg:block" aria-hidden />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-bg-inverse"
            aria-label="Afriex Creators, home"
          >
            <Logo tone="light" />
          </Link>
        </div>

        <div className="relative mt-10 hidden lg:block">
          <p className="display-md max-w-sm text-fg-on-inverse">{pitch}</p>
          <ul className="mt-8 space-y-3.5">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-fg-on-inverse-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-10 hidden text-xs text-fg-on-inverse-muted lg:block">
          Free to start · A flat 10% only on the sales you make
        </p>
      </aside>

      {/* Form */}
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center bg-bg px-4 py-12 sm:px-6"
      >
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
