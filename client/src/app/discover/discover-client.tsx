'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Package, Search } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'

interface Props {
  products: Product[]
}

/** Each product gets a stable, on-brand cover plate instead of a stock image. */
const plates = [
  'bg-accent text-fg-on-accent',
  'bg-bg-inverse text-signal',
  'bg-signal text-fg',
  'bg-success text-fg-on-accent',
  'bg-accent-deep text-fg-on-accent',
]

function plateFor(id: string) {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return plates[sum % plates.length]
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
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
      return p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
    })
  }, [products, query, currency])

  return (
    <>
      <section className="border-b border-border bg-bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <h1 className="display-lg max-w-2xl text-fg">
            Everything here is made by someone, not scraped from somewhere
          </h1>
          <p className="prose-lede mt-4 max-w-xl text-fg-muted">
            Templates, presets, courses, study packs and more. Pay in the listed currency and
            download instantly.
          </p>

          {products.length > 0 && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or keyword"
                  aria-label="Search products"
                  className="block min-h-11 w-full rounded-lg border border-border bg-bg-elevated py-2 pl-10 pr-3 text-sm text-fg placeholder-fg-muted transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/35"
                />
              </div>
              {currencies.length > 1 && (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by currency">
                  <button
                    type="button"
                    onClick={() => setCurrency(null)}
                    aria-pressed={currency === null}
                    className={`min-h-9 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ${
                      currency === null
                        ? 'border-accent bg-accent text-fg-on-accent'
                        : 'border-border bg-bg-elevated text-fg-muted hover:border-fg-subtle hover:text-fg'
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
                      className={`min-h-9 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ${
                        currency === c
                          ? 'border-accent bg-accent text-fg-on-accent'
                          : 'border-border bg-bg-elevated text-fg-muted hover:border-fg-subtle hover:text-fg'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-semibold text-fg-muted" role="status">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {currency ? ` priced in ${currency}` : ''}
            {query ? ` matching “${query}”` : ''}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Nothing published yet"
              description="Check back shortly, or be the first to put something up."
              action={<Button href="/signup">Open your shop free</Button>}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="Nothing matched that"
              description="Try a shorter search term, or clear the currency filter."
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
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/store/${product.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-bg-elevated transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-fg-subtle hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  <div
                    className={`flex h-32 items-center justify-center ${plateFor(product.id)}`}
                    aria-hidden
                  >
                    <span className="font-display text-4xl tracking-tight">
                      {initials(product.name)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-lg leading-snug text-fg">{product.name}</h2>
                    {product.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-fg-muted">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-border-light pt-4">
                      <span className="tabular font-display text-xl text-fg">
                        {formatMoney(product.price, product.currency)}
                      </span>
                      <span className="text-sm font-semibold text-accent">
                        Instant download
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
