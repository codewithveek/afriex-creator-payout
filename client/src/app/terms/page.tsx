import { MarketingShell } from '@/components/layout/marketing-shell'

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-fg">Terms of service</h1>
        <p className="mt-2 text-sm text-fg-subtle">Last updated: July 2026</p>
        <div className="mt-10 space-y-6 text-sm leading-relaxed text-fg-muted">
          <section>
            <h2 className="text-base font-semibold text-fg">1. The service</h2>
            <p className="mt-2">
              Afriex Creators lets creators list digital products, accept payments from buyers via
              Paystack or Flutterwave, deliver downloadable files, and request payouts of earnings
              through Afriex. By creating an account you agree to these terms.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">2. Creator responsibilities</h2>
            <p className="mt-2">
              You must own or have rights to sell the products you list. You are responsible for
              product quality, accurate descriptions, and customer support related to your content.
              Illegal, infringing, or harmful material is prohibited.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">3. Payments and fees</h2>
            <p className="mt-2">
              Buyer payments are processed by third-party collectors (primarily Paystack and
              Flutterwave). A platform fee is deducted from each confirmed sale before your
              available balance is credited. Collector fees are governed by those providers.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">4. Payouts</h2>
            <p className="mt-2">
              Creator payouts are processed exclusively via Afriex to a verified bank account you
              register. Withdrawals are subject to minimum amounts, cooldowns, and successful
              verification of your payout method. Failed payouts are credited back to your balance
              where possible.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">5. Refunds</h2>
            <p className="mt-2">
              Refund policies for digital goods depend on applicable law and collector rules.
              Confirmed refunds reverse the related earning and may adjust your balance.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-fg">6. Contact</h2>
            <p className="mt-2">
              Questions about these terms: support@afriexcreatorpayout.com
            </p>
          </section>
        </div>
      </article>
    </MarketingShell>
  )
}
