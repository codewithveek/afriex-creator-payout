import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileDown, ShieldCheck, Zap } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { formatMoney } from '@/lib/utils'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Discover
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex h-52 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-muted via-bg-muted to-bg-subtle sm:h-64">
            <FileDown className="h-14 w-14 text-accent/60" aria-hidden />
          </div>
          <h1 className="font-display mt-8 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="accent">Digital download</Badge>
            <Badge>{product.currency}</Badge>
          </div>
          {product.description ? (
            <div className="mt-6 prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-fg-muted">
                {product.description}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-fg-muted">No description provided for this product.</p>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-24 shadow-card">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Price</p>
                <p className="font-display mt-1 text-3xl font-semibold text-fg">
                  {formatMoney(product.price, product.currency)}
                </p>
              </div>

              <BuyButton product={product} />

              <ul className="space-y-3 border-t border-border-light pt-5">
                <li className="flex gap-3 text-sm text-fg-muted">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  Instant access after successful payment
                </li>
                <li className="flex gap-3 text-sm text-fg-muted">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  Secure checkout via Paystack or Flutterwave
                </li>
                <li className="flex gap-3 text-sm text-fg-muted">
                  <FileDown className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  Download link on your receipt and orders page
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ProductPage({ params }: Props) {
  return (
    <MarketingShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <Skeleton className="mb-8 h-5 w-32" />
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3 space-y-4">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-80 rounded-xl lg:col-span-2" />
            </div>
          </div>
        }
      >
        <ProductContent params={params} />
      </Suspense>
    </MarketingShell>
  )
}
