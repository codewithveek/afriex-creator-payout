import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { Skeleton } from '@/components/ui/skeleton'
import type { Product } from '@/lib/types'
import { ProductsClient } from './client'

async function getProducts(cookie: string | null) {
  try {
    return await apiFetch<{ data: Product[] }>('/api/products/mine', { cookie })
  } catch {
    return { data: [] }
  }
}

async function ProductsContent() {
  const cookie = await getCookieHeader()
  const { data: products } = await getProducts(cookie)

  return <ProductsClient initial={products} />
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
