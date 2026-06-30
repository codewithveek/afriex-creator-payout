import { Suspense } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import type { Product } from '@/lib/types'

async function getProducts() {
  try {
    return await apiFetch<{ data: Product[] }>('/api/products')
  } catch {
    return { data: [] }
  }
}

async function StoreContent() {
  const { data: products } = await getProducts()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Store</h1>
        <p className="mt-2 text-gray-600">Browse available products</p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-gray-500">
            No products available yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/store/${product.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
                  {product.description && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  )}
                  <p className="mt-4 text-xl font-bold text-blue-600">
                    ${Number.parseFloat(product.price).toFixed(2)} {product.currency}
                  </p>
                  {product.fileName && (
                    <p className="mt-2 text-xs text-gray-400">{product.fileName}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <StoreContent />
    </Suspense>
  )
}
