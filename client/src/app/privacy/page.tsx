import { MarketingShell } from '@/components/layout/marketing-shell'

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-fg">Privacy policy</h1>
        <p className="mt-2 text-sm text-fg-subtle">Last updated: July 2026</p>
        <div className="mt-10 space-y-6 text-sm leading-relaxed text-fg-muted">
          <section>
            <h2 className="text-base font-semibold text-fg">What we collect</h2>
            <p className="mt-2">
              Account details (name, email, password hash), creator profile fields (phone, country,
              payout currency), product metadata, order records, and payout method details required
              for Afriex disbursement. Bank account numbers are encrypted at rest.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">How we use data</h2>
            <p className="mt-2">
              To operate the marketplace, process payments, deliver downloads, send transactional
              email, compute earnings, and pay out creators. We do not sell personal data.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">Processors</h2>
            <p className="mt-2">
              Paystack and Flutterwave process buyer payments. Afriex processes creator payouts.
              Resend sends transactional email. Cloud storage may hold product files you upload.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">Your rights</h2>
            <p className="mt-2">
              You may request a data export or account deletion through the platform APIs where
              available, or by contacting support. Some records may be retained where required for
              legal, tax, or fraud prevention reasons.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">Contact</h2>
            <p className="mt-2">privacy@afriexcreatorpayout.com</p>
          </section>
        </div>
      </article>
    </MarketingShell>
  )
}
