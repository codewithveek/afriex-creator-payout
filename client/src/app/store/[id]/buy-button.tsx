'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ApiClientError } from '@/lib/api-client'
import { formatMoney, cn } from '@/lib/utils'
import { queryKeys } from '@/lib/queries/keys'
import { fetchCollectors, createCheckoutSession } from '@/lib/queries/checkout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Product, PaymentCollector } from '@/lib/types'

interface Props {
  product: Product
}

function collectorLabel(id: PaymentCollector['id']): string {
  if (id === 'flutterwave') return 'Flutterwave'
  if (id === 'afriex-checkout') return 'Afriex Checkout'
  if (id === 'stripe') return 'Stripe'
  return 'Paystack'
}

export function BuyButton({ product }: Props) {
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<PaymentCollector['id'] | null>(null)

  const collectorsQuery = useQuery({
    queryKey: queryKeys.collectors,
    queryFn: fetchCollectors,
    enabled: open,
  })

  const collectors = collectorsQuery.data ?? []
  const selectedProvider = provider ?? collectors[0]?.id ?? 'paystack'

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (response) => {
      window.location.href = response.data.sessionUrl
    },
  })

  function handleBuy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const customerEmail = form.get('email') as string
    const customerName = form.get('name') as string
    const successUrl = `${window.location.origin}/purchase/success?email=${encodeURIComponent(customerEmail)}`

    checkoutMutation.mutate({
      productId: product.id,
      customerEmail,
      customerName,
      paymentProvider: selectedProvider,
      successUrl,
      cancelUrl: `${window.location.origin}/store/${product.id}`,
    })
  }

  if (!open) {
    return (
      <Button size="lg" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        Buy now · {formatMoney(product.price, product.currency)}
      </Button>
    )
  }

  const errorMessage =
    checkoutMutation.error instanceof ApiClientError
      ? checkoutMutation.error.message
      : checkoutMutation.error
        ? 'Checkout failed. Please try again.'
        : ''

  return (
    <form
      onSubmit={handleBuy}
      className="w-full space-y-4 rounded-xl border border-border bg-bg-elevated p-5 shadow-card"
    >
      <div>
        <h3 className="text-sm font-semibold text-fg">Complete your purchase</h3>
        <p className="mt-1 text-xs text-fg-muted">
          You will be redirected to a secure checkout. Download access is emailed after payment.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-error-muted p-3 text-xs text-error" role="alert">
          {errorMessage}
        </div>
      )}

      <Input label="Full name" name="name" autoComplete="name" required />
      <Input
        label="Email for receipt & download"
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Pay with</legend>
        {collectorsQuery.isLoading ? (
          <p className="text-xs text-fg-subtle">Loading payment options…</p>
        ) : (
          <div className="grid gap-2">
            {collectors.map((c) => (
              <label
                key={c.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  selectedProvider === c.id
                    ? 'border-accent bg-accent-muted/50'
                    : 'border-border hover:bg-bg-muted',
                )}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value={c.id}
                  checked={selectedProvider === c.id}
                  onChange={() => setProvider(c.id)}
                  className="mt-1 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                    {c.name}
                    {c.primary && (
                      <span className="rounded-full bg-accent-muted px-1.5 py-0.5 text-[10px] font-medium text-accent-deep">
                        Popular
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-fg-muted">{c.description}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-fg-subtle">
          Paystack and Flutterwave are primary collectors. Afriex Checkout is also available.
          Creator withdrawals always go through Afriex payouts.
        </p>
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          loading={checkoutMutation.isPending}
          disabled={collectorsQuery.isLoading || collectors.length === 0}
          className="flex-1"
        >
          Continue to {collectorLabel(selectedProvider)}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={checkoutMutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
