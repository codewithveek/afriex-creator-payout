import Link from 'next/link'
import { Check } from 'lucide-react'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'

const included = [
  'Unlimited products',
  'Paystack & Flutterwave checkout',
  'Instant digital delivery',
  'Sales & earnings dashboard',
  'Afriex bank payouts',
  'Buyer receipts by email',
  'Creator sale notifications',
  'No monthly subscription',
]

export default function PricingPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-accent">Pricing</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight text-fg">
            Simple fee. Keep the rest.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-fg-muted">
            We only earn when you do. No monthly plan, no per-product charges, no surprise add-ons.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-border bg-bg-elevated p-8 shadow-[var(--shadow-lift)]">
          <p className="text-sm font-medium text-fg-muted">Platform fee per sale</p>
          <p className="font-display mt-2 text-5xl font-semibold text-fg">10%</p>
          <p className="mt-2 text-sm text-fg-muted">
            Deducted from gross before your available balance is credited. Payment collector fees
            (Paystack / Flutterwave) are separate and charged by those providers on their terms.
          </p>
          <ul className="mt-8 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-fg">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/signup" className="mt-8 block">
            <Button size="lg" className="w-full">
              Create free account
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-semibold text-fg">Minimum withdrawal</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Small floor (configurable on the platform, typically a few dollars equivalent) so
              micro-payouts do not create noise. You choose how much to withdraw above that.
            </p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-semibold text-fg">Payout currency</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Set your preferred payout currency in settings. Afriex handles delivery to your
              verified bank account in supported markets.
            </p>
          </div>
        </div>
      </div>
    </MarketingShell>
  )
}
