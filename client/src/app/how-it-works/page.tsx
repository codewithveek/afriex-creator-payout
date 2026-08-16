import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'How it works',
  description: 'What happens when you buy, and what happens when you sell.',
}

const buyerFlow = [
  {
    title: 'Find what you need',
    body: 'Browse by category or search by name. Every listing shows the price you’ll be charged, in US dollars.',
  },
  {
    title: 'Check out',
    body: 'Name, email, pay. No account required.',
  },
  {
    title: 'Download straight away',
    body: 'Your download link appears on screen and a receipt lands in your inbox.',
  },
  {
    title: 'Come back for it any time',
    body: 'Your orders page keeps every purchase. If a link expires, issue yourself a new one.',
  },
]

const sellerFlow = [
  {
    title: 'Upload what you already have',
    body: 'An ebook, a template pack, a preset bundle, a recorded course, a set of past questions.',
  },
  {
    title: 'Set your own price',
    body: 'Set a price in US dollars, and change it whenever you like.',
  },
  {
    title: 'Get paid while you sleep',
    body: 'Your balance updates per sale with the gross, the flat 10% fee, and the amount that’s yours.',
  },
  {
    title: 'Move the money to your bank',
    body: 'Register a bank account once, then withdraw whenever you like.',
  },
]

const safeguards = [
  {
    title: 'Money is separated from files',
    body: 'Payment is confirmed before a download link is issued, and a link is tied to one order.',
  },
  {
    title: 'Both sides keep a record',
    body: 'Buyers get a receipt and a permanent order history. Creators get a per-sale ledger with gross, fee, and net.',
  },
  {
    title: 'Bank details stay private',
    body: 'Buyers never see where a creator banks. Creators never see a buyer’s card. Payment details are encrypted.',
  },
]

function Track({
  label,
  title,
  lede,
  steps,
  cta,
  ctaHref,
  tone,
}: {
  label: string
  title: string
  lede: string
  steps: { title: string; body: string }[]
  cta: string
  ctaHref: string
  tone: 'light' | 'ink'
}) {
  const ink = tone === 'ink'
  return (
    <div
      className={
        ink
          ? 'relative flex overflow-hidden rounded-2xl border border-border-inverse bg-bg-inverse p-7 text-fg-on-inverse sm:p-10'
          : 'flex rounded-2xl border border-border bg-bg-elevated p-7 sm:p-10'
      }
    >
      {ink && <div className="ledger-lines absolute inset-0" aria-hidden />}
      <div className="relative flex w-full flex-col">
        <span
          className={
            ink
              ? 'inline-flex self-start rounded-full bg-signal px-3 py-1 text-sm font-semibold text-fg'
              : 'inline-flex self-start rounded-full bg-accent-muted px-3 py-1 text-sm font-semibold text-accent-deep'
          }
        >
          {label}
        </span>
        <h2 className={`display-md mt-5 ${ink ? 'text-fg-on-inverse' : 'text-fg'}`}>{title}</h2>
        <p
          className={`mt-3 max-w-md leading-relaxed ${
            ink ? 'on-ink text-fg-on-inverse-muted' : 'text-fg-muted'
          }`}
        >
          {lede}
        </p>

        <ol className="mt-9 space-y-7">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                className={`tabular mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  ink ? 'bg-signal text-fg' : 'bg-accent text-fg-on-accent'
                }`}
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <h3
                  className={`font-display text-lg ${ink ? 'text-fg-on-inverse' : 'text-fg'}`}
                >
                  {step.title}
                </h3>
                <p
                  className={`mt-1.5 text-sm leading-relaxed ${
                    ink ? 'on-ink text-fg-on-inverse-muted' : 'text-fg-muted'
                  }`}
                >
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <Button
          href={ctaHref}
          size="lg"
          variant={ink ? 'signal' : 'primary'}
          className="mt-9 w-full self-start sm:w-auto"
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <section className="border-b border-border bg-bg-muted">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="display-lg text-fg">One marketplace, two sides</h1>
          <p className="prose-lede mt-5 text-fg-muted">
            What happens when you buy, and what happens when you sell.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Track
            tone="light"
            label="If you're buying"
            title="Pay, download, get on with your day"
            lede="No shipping, no waiting, no back-and-forth about whether the transfer went through."
            steps={buyerFlow}
            cta="Browse the marketplace"
            ctaHref="/discover"
          />
          <Track
            tone="ink"
            label="If you're selling"
            title="Publish once, get paid every time"
            lede="Set it up once and it keeps working, including on the days you don't open your laptop."
            steps={sellerFlow}
            cta="Open your shop free"
            ctaHref="/signup"
          />
        </div>
      </section>

      <section className="border-y border-border bg-bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="display-md max-w-lg text-fg">What protects both sides</h2>
          <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {safeguards.map((item) => (
              <div key={item.title} className="border-t-2 border-accent pt-5">
                <dt className="font-display text-lg text-fg">{item.title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-fg-muted">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="display-md text-fg">Still deciding which side you&apos;re on?</h2>
          <p className="mt-2 max-w-lg leading-relaxed text-fg-muted">
            Both are free to start.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/discover" variant="outline" size="lg">
            Browse first
          </Button>
          <Button href="/signup" size="lg">
            Start selling
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </section>
    </MarketingShell>
  )
}
