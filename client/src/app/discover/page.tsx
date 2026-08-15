import { Suspense } from 'react'
import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api-client'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { DiscoverClient } from './discover-client'
import type { Product } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Browse the marketplace',
  description:
    'Templates, presets, courses, beat packs and study material from independent creators. Pay in the listed currency and download the moment it clears.',
}

async function getProducts() {
  try {
    return await apiFetch<{ data: Product[] }>('/api/products?pageSize=48')
  } catch {
    return { data: [] as Product[] }
  }
}

async function DiscoverContent() {
  const { data: products } = await getProducts()
  return <DiscoverClient products={products} />
}

export default function DiscoverPage() {
  return (
    <MarketingShell>
      <Suspense
        fallback={
          <>
            <div className="border-b border-border bg-bg-muted">
              <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
                <Skeleton className="mb-3 h-10 w-full max-w-xl" />
                <Skeleton className="mb-8 h-5 w-96 max-w-full" />
                <Skeleton className="h-11 w-full max-w-sm rounded-lg" />
              </div>
            </div>
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
              </div>
            </div>
          </>
        }
      >
        <DiscoverContent />
      </Suspense>
    </MarketingShell>
  )
}
