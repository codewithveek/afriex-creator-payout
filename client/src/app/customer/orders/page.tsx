import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { hasBuyerSessionHint } from '@/lib/cookies'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { CustomerOrdersClient } from './client'

export const metadata: Metadata = {
  title: 'Your orders',
  description: 'Everything you have bought, ready to download again.',
}

export default async function CustomerOrdersPage() {
  const [session, buyerHint] = await Promise.all([getSession(), hasBuyerSessionHint()])

  return (
    <MarketingShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
              role="status"
              aria-label="Loading"
            />
          </div>
        }
      >
        <CustomerOrdersClient
          creatorEmail={session?.user?.email ?? null}
          buyerHint={buyerHint}
        />
      </Suspense>
    </MarketingShell>
  )
}
