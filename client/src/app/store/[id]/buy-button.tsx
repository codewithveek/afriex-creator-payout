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
      <div>
        <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
          Buy now · {formatMoney(product.price, product.currency)}
        </Button>
        <p className="mt-3 text-center text-xs text-fg-muted">
          No account needed. Your email is only used for the receipt and the download.
        </p>
      </div>
    )
  }

  const errorMessage =
    checkoutMutation.error instanceof ApiClientError
      ? checkoutMutation.error.message
      : checkoutMutation.error
        ? 'We could not start checkout. Check your details and try again.'
        : ''

  return (
    <form onSubmit={handleBuy} className="space-y-5">
      <div>
        <h2 className="font-display text-lg text-fg">Where should we send it?</h2>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          You will pay on a secure page, then land back here with your download.
        </p>
      </div>

      {errorMessage && (
        <div
          className="rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <Input label="Your name" name="name" autoComplete="name" required />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        hint="Your receipt and download link go here."
      />

      {collectorsQuery.isLoading ? (
        <p className="text-sm text-fg-muted">Loading payment options…</p>
      ) : collectors.length > 1 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-fg">Pay with</legend>
          <div className="grid gap-2">
            {collectors.map((c) => (
              <label
                key={c.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150',
                  selectedProvider === c.id
                    ? 'border-accent bg-accent-muted/60'
                    : 'border-border hover:bg-bg-muted',
                )}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value={c.id}
                  checked={selectedProvider === c.id}
                  onChange={() => setProvider(c.id)}
                  className="mt-1 accent-(--color-accent)"
                />
                <span>
                  <span className="block text-sm font-semibold text-fg">{c.name}</span>
                  <span className="block text-xs leading-relaxed text-fg-muted">
                    {c.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          size="lg"
          loading={checkoutMutation.isPending}
          disabled={collectorsQuery.isLoading || collectors.length === 0}
          className="w-full"
        >
          Pay {formatMoney(product.price, product.currency)}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={checkoutMutation.isPending}
          className="w-full"
        >
          Not yet
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-fg-muted">
        Payment is encrypted end to end. We never see or store your card details, and the creator
        never sees them either.
      </p>
    </form>
  )
}
