import Link from 'next/link'
import {
  ArrowRight,
  Banknote,
  Download,
  Globe2,
  Package,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'

const steps = [
  {
    icon: Package,
    title: 'List your product',
    body: 'Upload an ebook, template, course pack, or any digital file. Set your price in USD, NGN, GHS, or KES.',
  },
  {
    icon: Banknote,
    title: 'Buyers pay locally',
    body: 'Customers check out with Paystack or Flutterwave: cards, bank transfer, USSD, and mobile money.',
  },
  {
    icon: Wallet,
    title: 'Withdraw with Afriex',
    body: 'Earnings land in your balance. Request a payout to your bank account through Afriex whenever you are ready.',
  },
]

const features = [
  {
    icon: Globe2,
    title: 'Local payments, global reach',
    body: 'Sell to buyers anywhere. They pay with methods they already use, and cross-border payouts actually arrive.',
  },
  {
    icon: Download,
    title: 'Instant digital delivery',
    body: 'After payment, buyers get a secure download link by email and on their orders page. No manual fulfilment.',
  },
  {
    icon: ShieldCheck,
    title: 'Clear money trail',
    body: 'See gross sales, platform fee, and net earnings per sale. Request withdrawals with full history.',
  },
  {
    icon: Sparkles,
    title: 'Simple fee, no surprises',
    body: 'A transparent platform fee on each sale. No monthly lock-in. You keep the rest of every payment.',
  },
]

const stats = [
  { label: 'Platform fee', value: '10%' },
  { label: 'Payout rails', value: 'Afriex' },
  { label: 'Checkout', value: 'Paystack · Flutterwave · Afriex' },
  { label: 'Currencies', value: 'USD · NGN · GHS · KES' },
]

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="surface-grain relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-medium text-fg-muted shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              Marketplace + Afriex payouts
            </p>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-fg sm:text-5xl lg:text-[3.25rem]">
              Sell digital products.
              <span className="block text-accent">Get paid anywhere.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
              Start with what you know. Package it as an ebook, template, or course, and sell it to
              anyone. Buyers pay with Paystack, Flutterwave, or Afriex Checkout, and you withdraw
              to your bank through Afriex.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/signup" size="lg" className="gap-2">
                Start selling free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/discover" size="lg" variant="outline">
                Discover products
              </Button>
            </div>
            <p className="mt-4 text-sm text-fg-subtle">
              No setup fee. Publish in minutes. Withdraw when you hit the minimum.
            </p>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-lift">
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
                    Available balance
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold text-fg">₦248,500.00</p>
                </div>
                <span className="rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success">
                  Ready to withdraw
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  { name: 'Brand Strategy Playbook', amount: '₦15,000', status: 'Paid' },
                  { name: 'Notion Content OS', amount: '₦8,500', status: 'Paid' },
                  { name: 'UI Kit for Fintech', amount: '₦22,000', status: 'Paid' },
                ].map((sale) => (
                  <li
                    key={sale.name}
                    className="flex items-center justify-between rounded-lg bg-bg-muted px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-fg">{sale.name}</p>
                      <p className="text-xs text-fg-subtle">{sale.status}</p>
                    </div>
                    <p className="text-sm font-semibold text-fg">{sale.amount}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg border border-dashed border-border bg-accent-muted/40 px-3 py-3 text-sm text-accent-deep">
                Payouts go to your bank via Afriex. Buyers never see your account details.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border bg-bg-inverse text-fg-on-accent" aria-label="At a glance">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs font-medium uppercase tracking-wider text-fg-on-accent/60">
                {s.label}
              </p>
              <p className="mt-1 text-sm font-semibold sm:text-base">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-accent">How it works</p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            From upload to bank deposit
          </h2>
          <p className="mt-3 text-fg-muted">
            Three steps. No plugins. No confusing merchant accounts.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <li
                key={step.title}
                className="relative rounded-xl border border-border bg-bg-elevated p-6 shadow-card"
              >
                <span className="absolute right-4 top-4 font-display text-3xl font-semibold text-bg-subtle">
                  {i + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted text-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-fg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{step.body}</p>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-bg-muted/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-accent">Why creators switch</p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Storefront that respects how your buyers pay
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="flex gap-4 rounded-xl bg-bg-elevated p-6 shadow-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-subtle text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-fg">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Collectors callout */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-card">
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-border p-8 lg:border-b-0 lg:border-r lg:p-10">
              <p className="text-sm font-semibold text-accent">For buyers</p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-fg">
                Pay with tools you already trust
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                At checkout, pick <strong className="font-medium text-fg">Paystack</strong>,{' '}
                <strong className="font-medium text-fg">Flutterwave</strong>, or{' '}
                <strong className="font-medium text-fg">Afriex Checkout</strong>. Cards, transfers,
                USSD, and mobile money are supported where each collector operates.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-lg bg-[var(--color-paystack)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-paystack)]">
                  Paystack
                </span>
                <span className="rounded-lg bg-[var(--color-flutterwave)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-flutterwave)]">
                  Flutterwave
                </span>
                <span className="rounded-lg bg-accent-muted px-3 py-2 text-sm font-semibold text-accent-deep">
                  Afriex Checkout
                </span>
              </div>
            </div>
            <div className="bg-bg-inverse p-8 text-fg-on-accent lg:p-10">
              <p className="text-sm font-semibold text-fg-on-accent/70">For creators</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">
                Afriex is your only payout rail
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-on-accent/75">
                We separate collection from payout on purpose. Buyers pay through trusted
                collectors. You withdraw earnings exclusively through Afriex to your verified bank
                account. Clean books. Clear responsibility.
              </p>
              <Link href="/how-it-works" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-fg-on-accent underline-offset-4 hover:underline">
                See the full money flow
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-accent-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
              Ready to sell your next product?
            </h2>
            <p className="mt-2 text-fg-muted">
              Create a free account, upload a file, and share your product link today.
            </p>
          </div>
          <Button href="/signup" size="lg" className="gap-2 whitespace-nowrap">
            Create creator account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </MarketingShell>
  )
}
