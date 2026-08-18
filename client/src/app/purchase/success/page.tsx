import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseSuccessClient } from './client'

export const metadata: Metadata = {
  title: 'Payment received',
  description: 'Your receipt and download link.',
}

export default function PurchaseSuccessPage() {
  return (
    <MarketingShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 py-16">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        }
      >
        <PurchaseSuccessClient />
      </Suspense>
    </MarketingShell>
  )
}
