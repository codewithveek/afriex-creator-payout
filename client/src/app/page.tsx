import Link from 'next/link'
import { ArrowRight, ArrowDownToLine, Landmark, ShieldCheck } from 'lucide-react'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'

const marquee = [
  'Notion templates',
  'Lightroom presets',
  'Beat packs',
  'CV & cover letter kits',
  'Figma UI kits',
  'Sourdough courses',
  'Past questions',
  'Wedding invite suites',
  'Sample packs',
  'Business plan packs',
  'Photo LUTs',
  'Excel models',
]

const buyerPoints = [
  {
    title: 'Instant access after payment',
    body: '',
  },
  {
    title: 'Pay the way you already pay',
    body: 'Card, bank transfer, or mobile money.',
  },
  {
    title: "Lost the link? It's not gone",
    body: 'Access your purchases from the orders page.',
  },
]

const sellerPoints = [
  {
    icon: ArrowDownToLine,
    title: 'Publish in ten minutes',
    body: 'Upload the product, name your price, hit publish. You get a link you can share on social media, a newsletter, or a group chat.',
  },
  {
    icon: ShieldCheck,
    title: 'Delivery handles itself',
    body: "Buyers are charged, receipted, and sent their download automatically.",
  },
  {
    icon: Landmark,
    title: 'Cash out to your own bank',
    body: 'Register a bank account once, then withdraw whenever you like, in your local currency.',
  },
]

const categories = [
  { label: 'Templates & docs', example: 'Pitch decks, CVs, contracts', from: 'from $3' },
  { label: 'Design assets', example: 'UI kits, fonts, LUTs, mockups', from: 'from $6' },
  { label: 'Music & audio', example: 'Beat packs, sample libraries', from: 'from $5' },
  { label: 'Courses & guides', example: 'Video lessons, playbooks, ebooks', from: 'from $12' },
  { label: 'Study material', example: 'Past questions, revision packs', from: 'from $2' },
  { label: 'Photo & video', example: 'Presets, overlays, stock packs', from: 'from $4' },
]

const faqs = [
  {
    audience: 'Buying',
    q: 'What exactly do I get?',
    a: 'A digital file described on the product page. After payment you get an instant download link on screen, a receipt by email, and a permanent record on your orders page.',
  },
  {
    audience: 'Buying',
    q: 'Do I need an account to buy?',
    a: 'No. You can check out as a guest with just your name and email. Creating an account later keeps every purchase and download in one place.',
  },
  {
    audience: 'Buying',
    q: 'Something was wrong with the file. Now what?',
    a: 'Reply to your receipt. Every order is tied to a creator and a payment record, so refunds and re-deliveries can be traced.',
  },
  {
    audience: 'Selling',
    q: 'What does it cost to sell?',
    a: "Nothing to open a shop, nothing monthly, nothing per product. A flat fee of 10% is charged on each sale you actually make.",
  },
  {
    audience: 'Selling',
    q: 'How fast do I get my money?',
    a: 'Earnings land in your balance as soon as a sale is confirmed. You can request a withdrawal to your verified bank account whenever you want.',
  },
  {
    audience: 'Selling',
    q: 'Can I sell to buyers outside my country?',
    a: 'Yes. Everything is listed in US dollars, so you can sell anywhere, and withdrawals arrive in your local currency.',
  },
]

export default function HomePage() {
  return (
    <MarketingShell>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border-inverse bg-bg-inverse text-fg-on-inverse">
        <div className="ink-glow absolute inset-0" aria-hidden />
        <div className="ledger-lines absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-28 lg:py-36">
          <h1 className="rise display-xl max-w-4xl text-fg-on-inverse">
            Buy it in two taps.
            <span className="block text-signal">Sell it in ten minutes.</span>
          </h1>
          <p className="rise stagger-2 on-ink prose-lede mt-8 max-w-2xl text-fg-on-inverse-muted">
            A marketplace for digital products — templates, presets, beat packs, courses, study
            material, and more.
          </p>
          <div className="rise stagger-3 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/discover" size="lg" variant="signal">
              Browse the marketplace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button href="/signup" size="lg" variant="outline-inverse">
              Open your shop free
            </Button>
          </div>
          <p className="rise stagger-4 mt-6 text-sm text-fg-on-inverse-muted">
            Free to join · No monthly fee · You only pay when you sell
          </p>
        </div>
      </section>

      {/* ── What people sell here ────────────────────────────────────────── */}
      <section className="ticker overflow-hidden border-b border-border bg-bg-muted py-4">
        <h2 className="sr-only">Popular categories</h2>
        <div className="ticker-track gap-8" aria-hidden>
          {[...marquee, ...marquee].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex shrink-0 items-center gap-8 text-sm font-semibold whitespace-nowrap text-fg-muted"
            >
              {item}
              <span className="h-1 w-1 rounded-full bg-accent/50" />
            </span>
          ))}
        </div>
      </section>

      {/* ── Buyers ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="rise-in-view lg:sticky lg:top-28 lg:self-start">
            <span className="inline-flex rounded-full bg-accent-muted px-3 py-1 text-sm font-semibold text-accent-deep">
              For buyers
            </span>
            <h2 className="display-lg mt-5 text-fg">Pay once. Download now. Keep it forever.</h2>
            <p className="prose-lede mt-4 max-w-md text-fg-muted">
              Products made by real people, priced in US dollars,
              and delivered instantly.
            </p>
            <Button href="/discover" size="lg" className="mt-8">
              Browse the marketplace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <dl className="divide-y divide-border border-t border-border">
            {buyerPoints.map((point) => (
              <div key={point.title} className="rise-in-view py-7 first:pt-8">
                <dt className="font-display text-xl text-fg">{point.title}</dt>
                {point.body && (
                  <dd className="mt-2.5 max-w-prose leading-relaxed text-fg-muted">{point.body}</dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="display-md max-w-md text-fg">
              Someone has already made the thing you were about to build from scratch
            </h2>
            <Link
              href="/discover"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              See everything on sale
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <li key={cat.label}>
                <Link
                  href="/discover"
                  className="flex h-full flex-col justify-between gap-6 bg-bg-elevated p-6 transition-colors duration-150 hover:bg-accent-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <div>
                    <p className="font-display text-lg text-fg">{cat.label}</p>
                    <p className="mt-1.5 text-sm text-fg-muted">{cat.example}</p>
                  </div>
                  <p className="tabular text-sm font-semibold text-accent">{cat.from}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Creators ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-bg-inverse text-fg-on-inverse">
        <div className="ledger-lines absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-signal px-3 py-1 text-sm font-semibold text-fg">
              For creators
            </span>
            <h2 className="display-lg mt-5 text-fg-on-inverse">
              You made it. You should get paid for it.
            </h2>
            <p className="on-ink prose-lede mt-4 text-fg-on-inverse-muted">
              Selling what you make shouldn&apos;t require a company, or a friend abroad to receive
              payments for you. Publish, sell, withdraw.
            </p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <ol className="space-y-8">
              {sellerPoints.map((point, i) => {
                const Icon = point.icon
                return (
                  <li key={point.title} className="rise-in-view flex gap-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-inverse bg-bg-inverse-soft text-signal">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-xl text-fg-on-inverse">
                        <span className="tabular mr-2 text-signal">{i + 1}</span>
                        {point.title}
                      </h3>
                      <p className="on-ink mt-2 max-w-prose text-fg-on-inverse-muted">
                        {point.body}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>

            {/* Worked example — the money, in plain arithmetic */}
            <div className="rise-in-view rounded-2xl border border-border-inverse bg-bg-inverse-soft/60 p-7">
              <p className="font-display text-sm text-fg-on-inverse">
                A $50 sale, all the way through
              </p>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-fg-on-inverse-muted">Your listed price</dt>
                  <dd className="tabular text-fg-on-inverse">$50.00</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-fg-on-inverse-muted">Platform fee (10%)</dt>
                  <dd className="tabular text-fg-on-inverse-muted">−$5.00</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border-inverse pt-4">
                  <dt className="font-semibold text-fg-on-inverse">Credited to you</dt>
                  <dd className="tabular font-display text-2xl text-signal">$45.00</dd>
                </div>
              </dl>
              <p className="on-ink mt-6 text-sm text-fg-on-inverse-muted">
                No monthly fee, no listing fee, no charge for the days you don&apos;t sell.
              </p>
              <Button href="/signup" variant="signal" size="lg" className="mt-7 w-full">
                Open your shop free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <h2 className="display-md max-w-lg text-fg">
          Questions people ask before their first order
        </h2>
        <div className="mt-10 grid gap-x-12 gap-y-1 md:grid-cols-2">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group border-b border-border py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-md font-semibold text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg">
                <span>
                  <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    {faq.audience}
                  </span>
                  {faq.q}
                </span>
                <span
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-fg-muted transition-transform duration-200 group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-prose pr-9 leading-relaxed text-fg-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Two doors ────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-bg-muted">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden px-4 py-20 sm:px-6 md:grid-cols-2">
          <div className="rounded-t-2xl border border-border bg-bg-elevated p-8 sm:p-10 md:rounded-l-2xl md:rounded-tr-none md:border-r-0">
            <h2 className="display-md text-fg">Here to buy?</h2>
            <p className="mt-3 max-w-sm leading-relaxed text-fg-muted">
              Find something that saves you a weekend of work, and have it before
              you finish your coffee.
            </p>
            <Button href="/discover" size="lg" className="mt-7">
              Browse the marketplace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="rounded-b-2xl border border-border-inverse bg-bg-inverse p-8 text-fg-on-inverse sm:p-10 md:rounded-r-2xl md:rounded-bl-none">
            <h2 className="display-md text-fg-on-inverse">Here to sell?</h2>
            <p className="on-ink mt-3 max-w-sm text-fg-on-inverse-muted">
              You already know something worth paying for. Put it up today and make your first sale.
            </p>
            <Button href="/signup" variant="signal" size="lg" className="mt-7">
              Open your shop free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
