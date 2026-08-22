import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileDown, Lock, RefreshCw, Zap } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/auth'
import { formatMoney, formatFileSize } from '@/lib/utils'
import { MarketingShell } from '@/components/layout/marketing-shell'
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const response = await getProduct(id)
  if (!response) return { title: 'Product' }

  const product = response.data
  const price = formatMoney(product.price, product.currency)
  return {
    title: product.name,
    description:
      product.description?.slice(0, 155) ??
      `${product.name} — ${price}. Instant download the moment your payment is confirmed.`,
    openGraph: {
      title: `${product.name} · ${price}`,
      description: product.description?.slice(0, 155) ?? 'Instant digital download.',
    },
  }
}

const assurances = [
  { icon: Zap, text: 'Download unlocks the moment payment is confirmed' },
  { icon: Lock, text: 'Encrypted checkout — your card details never touch this site' },
  { icon: RefreshCw, text: 'Link expired? Re-issue it yourself from your orders page' },
]

async function ProductContent({ params }: Props) {
  const { id } = await params
  const [response, session] = await Promise.all([getProduct(id), getSession()])
  if (!response) notFound()

  const product = response.data
  // Signed in? Check out as yourself. Guests still buy with just an email.
  const buyer = session?.user ? { name: session.user.name, email: session.user.email } : null
  const fileSize = formatFileSize(product.fileSize)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All products
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-5 lg:gap-14">
        <div className="lg:col-span-3">
          <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-bg-inverse sm:h-72">
            <div className="ledger-lines absolute inset-0" aria-hidden />
            <FileDown className="relative h-14 w-14 text-signal" aria-hidden />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Badge variant="accent">Digital download</Badge>
            {fileSize && <Badge>{fileSize}</Badge>}
          </div>

          <h1 className="display-lg mt-4 text-fg">{product.name}</h1>

          {product.description ? (
            <p className="mt-6 max-w-prose text-base leading-relaxed whitespace-pre-wrap text-fg-muted">
              {product.description}
            </p>
          ) : (
            <p className="mt-6 text-fg-muted">No description added yet.</p>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-card lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-fg-muted">One-time price</p>
            <p className="tabular font-display mt-1 text-4xl text-fg">
              {formatMoney(product.price, product.currency)}
            </p>
            <p className="mt-1.5 text-sm text-fg-muted">Pay once, keep it. No subscription.</p>

            <div className="mt-6">
              <BuyButton product={product} buyer={buyer} />
            </div>

            <ul className="mt-6 space-y-3.5 border-t border-border-light pt-5">
              {assurances.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.text} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    {item.text}
                  </li>
                )
              })}
            </ul>
          </div>
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
            <div className="grid gap-10 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                <Skeleton className="h-72 w-full rounded-2xl" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
            </div>
          </div>
        }
      >
        <ProductContent params={params} />
      </Suspense>
    </MarketingShell>
  )
}
