import type { Metadata } from 'next'
import { MarketingShell } from '@/components/layout/marketing-shell'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What Afriex Creators collects, why, and what we never do with it.',
}

const sections = [
  {
    title: 'What we collect',
    body: 'Account details (name, email, and a hashed password), creator profile fields (phone, country, payout currency), product information, order records, and the bank details needed to pay you. Bank account numbers are encrypted at rest.',
  },
  {
    title: 'How we use it',
    body: 'To run the marketplace: take payments, deliver downloads, send receipts and notifications, calculate earnings, and move money to creators. We do not sell personal data, and we do not share buyer contact details with creators beyond what a receipt requires.',
  },
  {
    title: 'Who else touches it',
    body: 'Licensed payment partners handle card and transfer processing, a transactional email provider sends your receipts and alerts, and cloud storage holds the product files creators upload. Each is bound by contract to use the data only to provide that service. A current list of named processors is available on request.',
  },
  {
    title: 'Card details',
    body: 'Payment details are entered on the payment partner’s own encrypted checkout. They never pass through this site and are never stored here.',
  },
  {
    title: 'Your rights',
    body: 'You can request a copy of your data or ask for your account to be deleted. Some records — sales, refunds, and payouts — must be retained for legal, tax, and fraud-prevention reasons even after an account closes.',
  },
  {
    title: 'Getting in touch',
    body: 'privacy@afriexcreatorpayout.com',
  },
]

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="display-lg text-fg">Privacy policy</h1>
        <p className="mt-3 text-sm text-fg-muted">Last updated: July 2026</p>

        <div className="mt-12 divide-y divide-border border-t border-border">
          {sections.map((section) => (
            <section key={section.title} className="py-7">
              <h2 className="font-display text-xl text-fg">{section.title}</h2>
              <p className="mt-3 max-w-prose leading-relaxed text-fg-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </MarketingShell>
  )
}
