import type { Metadata } from 'next'
import { MarketingShell } from '@/components/layout/marketing-shell'

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The rules for buying and selling on Afriex Creators, in plain language.',
}

const sections = [
  {
    title: 'What this service does',
    body: 'Afriex Creators is a marketplace for digital products. Creators list files for sale, buyers pay for them, the file is delivered automatically, and creators withdraw their earnings to a bank account they register. Creating an account means you accept these terms.',
  },
  {
    title: 'What creators are responsible for',
    body: 'You must own the rights to everything you list, describe it accurately, and support the people who buy it. Illegal, infringing, or harmful material isn’t allowed and will be removed.',
  },
  {
    title: 'Payments and fees',
    body: 'Buyer payments are handled by licensed payment partners. A flat platform fee is deducted from each confirmed sale before your balance is credited. Payment partners may apply their own processing charges under their own terms.',
  },
  {
    title: 'Withdrawals',
    body: 'Earnings are withdrawn to a bank account you register and we verify. Withdrawals are subject to a minimum amount, a short cooldown between requests, and successful verification. If a transfer fails, the amount is returned to your balance where possible.',
  },
  {
    title: 'Refunds',
    body: 'Refund rights for digital goods depend on applicable law and the rules of the payment partner used. A confirmed refund reverses the related earning and adjusts the creator balance.',
  },
  {
    title: 'Buyer downloads',
    body: 'Download links are tied to a single confirmed order and expire after a period for security. You can issue yourself a new link from your orders page while your order stands.',
  },
  {
    title: 'Getting in touch',
    body: 'Questions about these terms: support@afriexcreatorpayout.com',
  },
]

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="display-lg text-fg">Terms of service</h1>
        <p className="mt-3 text-sm text-fg-muted">Last updated: July 2026</p>

        <div className="mt-12 divide-y divide-border border-t border-border">
          {sections.map((section, i) => (
            <section key={section.title} className="py-7">
              <h2 className="font-display text-xl text-fg">
                <span className="tabular mr-3 text-accent">{i + 1}</span>
                {section.title}
              </h2>
              <p className="mt-3 max-w-prose leading-relaxed text-fg-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </MarketingShell>
  )
}
