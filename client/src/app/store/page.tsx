import { Suspense } from 'react'
import Link from 'next/link'
import { Package, Search } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { formatMoney } from '@/lib/utils'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'

async function getProducts() {
  try {
    return await apiFetch<{ data: Product[] }>('/api/products?pageSize=48')
  } catch {
    return { data: [] as Product[] }
  }
}

async function StoreContent() {
  const { data: products } = await getProducts()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Marketplace</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Digital products
          </h1>
          <p className="mt-2 max-w-xl text-fg-muted">
            Ebooks, templates, kits, and more from independent creators. Instant download after
            checkout with Paystack or Flutterwave.
          </p>
        </div>
        <Badge variant="accent" className="w-fit">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </Badge>
      </div>

      {products.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Nothing published yet"
            description="Creators are still uploading. Check back soon, or start selling your own digital products."
            action={
              <Link href="/signup">
                <Button>Become a creator</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/store/${product.id}`}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl"
            >
              <Card className="h-full overflow-hidden border-border transition-[box-shadow,transform] duration-200 group-hover:shadow-[var(--shadow-lift)]">
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-accent-muted via-bg-muted to-bg-subtle">
                  <Package className="h-10 w-10 text-accent/70 transition-transform duration-200 group-hover:scale-105" />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-fg group-hover:text-accent-deep">
                      {product.name}
                    </h2>
                    <Badge variant="default">{product.currency}</Badge>
                  </div>
                  {product.description && (
                    <p className="mt-2 text-sm text-fg-muted line-clamp-2">{product.description}</p>
                  )}
                  <p className="mt-4 font-display text-xl font-semibold text-fg">
                    {formatMoney(product.price, product.currency)}
                  </p>
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
        <StoreContent />
      </Suspense>
    </MarketingShell>
  )
}
