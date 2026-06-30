import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'
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
  const cookie = cookies().toString() || null
  const { data: products } = await getProducts(cookie)

  return <ProductsClient initial={products} />
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}
