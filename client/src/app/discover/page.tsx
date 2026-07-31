import { Suspense } from 'react'
import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api-client'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { DiscoverClient } from './discover-client'
import type { Product } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Discover',
  description:
    'Browse ebooks, courses, templates, and more from independent creators. Pay with Paystack, Flutterwave, or Afriex Checkout and download instantly.',
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
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-2 h-10 w-64" />
            <Skeleton className="mb-10 h-5 w-96 max-w-full" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        }
      >
        <DiscoverContent />
      </Suspense>
    </MarketingShell>
  )
}
