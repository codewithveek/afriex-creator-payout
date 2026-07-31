'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Package, Search } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'

interface Props {
  products: Product[]
}

export function DiscoverClient({ products }: Props) {
  const [query, setQuery] = useState('')
  const [currency, setCurrency] = useState<string | null>(null)

  const currencies = useMemo(
    () => Array.from(new Set(products.map((p) => p.currency))).sort(),
    [products],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (currency && p.currency !== currency) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      )
    })
  }, [products, query, currency])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Discover</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Find your next favorite thing
          </h1>
          <p className="mt-2 max-w-xl text-fg-muted">
            Ebooks, templates, courses, and kits from independent creators. Pay in your currency,
            download instantly.
          </p>
        </div>
        <Badge variant="accent" className="w-fit">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </Badge>
      </div>

      {products.length > 0 && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="block min-h-10 w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-sm text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {currencies.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by currency">
              <button
                type="button"
                onClick={() => setCurrency(null)}
                aria-pressed={currency === null}
                className={`min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                  currency === null
                    ? 'border-accent bg-accent-muted text-accent-deep'
                    : 'border-border text-fg-muted hover:bg-bg-muted'
                }`}
              >
                All
              </button>
              {currencies.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(currency === c ? null : c)}
                  aria-pressed={currency === c}
                  className={`min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                    currency === c
                      ? 'border-accent bg-accent-muted text-accent-deep'
                      : 'border-border text-fg-muted hover:bg-bg-muted'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="sr-only" role="status">
        {filtered.length} {filtered.length === 1 ? 'product' : 'products'} shown
      </p>

      {products.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Nothing published yet"
            description="Creators are still uploading. Check back soon, or start selling your own digital products."
            action={<Button href="/signup">Start selling</Button>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No matches"
            description="Try a different search term or clear the currency filter."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setCurrency(null)
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/store/${product.id}`}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl"
            >
              <Card className="h-full overflow-hidden border-border transition-[box-shadow,transform] duration-200 group-hover:shadow-lift">
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
