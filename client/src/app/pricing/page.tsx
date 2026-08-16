import type { Metadata } from 'next'
import { ArrowRight, Check } from 'lucide-react'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Free to open a shop. A flat 10% on each sale. Buyers pay nothing extra.',
}

const included = [
  'Unlimited products and unlimited sales',
  'Your own shareable product links',
  'Automatic delivery and buyer receipts',
  'Sales, fees, and balance in one ledger',
  'Withdrawals to your own bank account',
  'Sell in US dollars, get paid in your local currency',
  'Sale alerts as they happen',
  'No monthly subscription',
]

const examples = [
  { price: '$10.00', fee: '$1.00', net: '$9.00' },
  { price: '$25.00', fee: '$2.50', net: '$22.50' },
  { price: '$50.00', fee: '$5.00', net: '$45.00' },
]

const notes = [
  {
    q: 'What does it cost a buyer?',
    a: 'The listed price and nothing more. No booking fee, no service charge.',
  },
  {
    q: 'When is the fee taken?',
    a: 'Once, when a sale is confirmed. It comes out of the gross before your balance is credited.',
  },
  {
    q: 'Is there a minimum withdrawal?',
    a: 'A small one, so transfer costs don’t eat into a payout. Above it, you decide the amount and the timing.',
  },
  {
    q: 'Which currency am I paid in?',
    a: 'Products are listed in US dollars. Withdrawals arrive in the payout currency you pick in settings, straight into your local bank account.',
  },
]

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-border-inverse bg-bg-inverse text-fg-on-inverse">
        <div className="ink-glow absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="display-lg max-w-xl text-fg-on-inverse">
                We only make money on the days you do
              </h1>
              <p className="on-ink prose-lede mt-5 max-w-lg text-fg-on-inverse-muted">
                Opening a shop is free. A flat share of each completed sale is the whole business
                model, and buyers never pay above the listed price.
              </p>
            </div>
            <div className="shrink-0">
              <p className="font-display text-[5rem] leading-none text-signal sm:text-[6rem]">10%</p>
              <p className="mt-2 text-sm font-semibold text-fg-on-inverse">
                per completed sale · nothing else
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <h2 className="display-md text-fg">What the fee already covers</h2>
            <ul className="mt-8 grid gap-y-4 sm:grid-cols-2 sm:gap-x-8">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-fg">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-12 rounded-xl border border-border bg-bg-muted p-6 sm:p-8">
              <h3 className="font-display text-lg text-fg">The maths, on real numbers</h3>
              <table className="mt-5 w-full text-sm">
                <caption className="sr-only">Example sales showing price, fee, and payout</caption>
                <thead>
                  <tr className="border-b border-border text-left text-fg-muted">
                    <th scope="col" className="pb-2 font-semibold">
                      You list at
                    </th>
                    <th scope="col" className="pb-2 text-right font-semibold">
                      Fee
                    </th>
                    <th scope="col" className="pb-2 text-right font-semibold">
                      You receive
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {examples.map((row) => (
                    <tr key={row.price} className="border-b border-border-light last:border-0">
                      <td className="tabular py-3 font-semibold text-fg">{row.price}</td>
                      <td className="tabular py-3 text-right text-fg-muted">−{row.fee}</td>
                      <td className="tabular py-3 text-right font-semibold text-success">
                        {row.net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border bg-bg-elevated p-7 shadow-card sm:p-8">
              <p className="font-display text-xl text-fg">Free to open. Free to keep open.</p>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                No plan to choose and no card to enter. The fee only applies to money that has
                already reached you.
              </p>
              <Button href="/signup" size="lg" className="mt-7 w-full">
                Open your shop
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <p className="mt-4 text-center text-xs text-fg-muted">Takes about ten minutes</p>
            </div>
          </div>
        </div>

        <dl className="mt-16 grid gap-x-12 gap-y-8 border-t border-border pt-10 sm:grid-cols-2">
          {notes.map((note) => (
            <div key={note.q}>
              <dt className="font-display text-lg text-fg">{note.q}</dt>
              <dd className="mt-2 max-w-prose leading-relaxed text-fg-muted">{note.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-border bg-bg-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="display-md text-fg">Just here to buy something?</h2>
            <p className="mt-2 leading-relaxed text-fg-muted">
              None of this applies to you. You pay the price on the tag.
            </p>
          </div>
          <Button href="/discover" variant="outline" size="lg" className="shrink-0">
            Browse the marketplace
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </section>
    </MarketingShell>
  )
}
