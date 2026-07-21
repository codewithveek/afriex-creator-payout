import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
          <h1 className="text-3xl font-bold text-fg">{product.name}</h1>
          {product.description && (
            <p className="mt-4 text-fg-muted whitespace-pre-wrap">{product.description}</p>
          )}
          <div className="mt-8 flex items-center justify-between border-t border-border-light pt-6">
            <p className="text-2xl font-bold text-accent">
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
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card>
          <CardContent className="p-8">
            <Skeleton className="mb-4 h-9 w-3/4" />
            <Skeleton className="mb-2 h-5 w-full" />
            <Skeleton className="mb-2 h-5 w-5/6" />
            <Skeleton className="h-5 w-2/3" />
          </CardContent>
        </Card>
      </div>
    }>
      <ProductContent params={params} />
    </Suspense>
  )
}
