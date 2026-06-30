'use client'

import { useState } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
}

export function BuyButton({ product }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBuy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const customerEmail = form.get('email') as string
    const customerName = form.get('name') as string

    try {
      const response = await api.post<{ data: { sessionId: string; sessionUrl: string } }>(
        '/api/checkout/sessions',
        {
          productId: product.id,
          customerEmail,
          customerName,
          successUrl: `${window.location.origin}/customer/orders?email=${encodeURIComponent(customerEmail)}`,
          cancelUrl: `${window.location.origin}/store/${product.id}`,
        },
      )
      window.location.href = response.data.sessionUrl
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (showForm) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          <form onSubmit={handleBuy} className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700" role="alert">
                {error}
              </div>
            )}
            <Input label="Your Name" name="name" required />
            <Input label="Email" name="email" type="email" required />
            <div className="flex gap-2">
              <Button type="submit" loading={loading} className="flex-1">
                Pay ${Number.parseFloat(product.price).toFixed(2)}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return <Button size="lg" onClick={() => setShowForm(true)}>Buy now</Button>
}
