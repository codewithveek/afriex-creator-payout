import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { BuyButton } from './buy-button'
import type { Product } from '@/lib/types'

async function getProduct(id: string) {
  try {
    return await apiFetch<{ data: Product }>(`/api/products/${id}`)
  } catch {
    return null
  }
}

interface Props {
  params: Promise<{ id: string }>
}

async function ProductContent({ params }: Props) {
  const { id } = await params
  const response = await getProduct(id)
  if (!response) notFound()

  const product = response.data

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="mt-4 text-gray-600 whitespace-pre-wrap">{product.description}</p>
          )}
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <p className="text-2xl font-bold text-blue-600">
              ${Number.parseFloat(product.price).toFixed(2)} {product.currency}
            </p>
            <BuyButton product={product} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  )
}
