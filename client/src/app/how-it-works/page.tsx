import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'

const flow = [
  {
    who: 'Creator',
    title: 'Publish a product',
    body: 'Upload your digital file, set a price in USD, NGN, GHS, or KES, and publish. Share the store link with your audience.',
  },
  {
    who: 'Buyer',
    title: 'Pay with Paystack or Flutterwave',
    body: 'At checkout the buyer chooses a collector. Cards, bank transfer, USSD, and mobile money are available where each collector supports them.',
  },
  {
    who: 'Platform',
    title: 'Confirm and deliver',
    body: 'A webhook marks the order paid, generates a download token, emails the buyer a receipt, and credits your earnings after the platform fee.',
  },
  {
    who: 'Creator',
    title: 'Withdraw via Afriex',
    body: 'Register a bank payout method once. Request a withdrawal whenever you want. Afriex sends funds to your account. That is the only payout rail.',
  },
]

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold text-accent">How it works</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight text-fg">
          The full path from product to payout
        </h1>
        <p className="mt-4 text-lg text-fg-muted">
          Collection and payout are intentionally separate. Buyers use Paystack or Flutterwave.
          Creators are paid only through Afriex.
        </p>

        <ol className="mt-12 space-y-6">
          {flow.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-border bg-bg-elevated p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-fg-on-accent">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  {step.who}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-fg">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-xl bg-bg-inverse p-8 text-fg-on-accent">
          <h2 className="font-display text-2xl font-semibold">Why this split?</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-on-accent/80">
            Local collectors excel at taking payment. Afriex excels at moving creator earnings to
            bank accounts across borders. Keeping those roles clear means fewer failed payouts and
            a money trail you can explain to finance (or yourself at tax time).
          </p>
          <Link href="/signup" className="mt-6 inline-block">
            <Button className="gap-2 bg-accent hover:bg-accent-hover">
              Start selling
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </MarketingShell>
  )
}
