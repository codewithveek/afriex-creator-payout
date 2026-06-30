'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Order } from '@/lib/types'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  COMPLETED: 'bg-green-50 text-green-700',
  REFUNDED: 'bg-red-50 text-red-700',
  FAILED: 'bg-gray-50 text-gray-700',
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email) {
      setLoading(false)
      return
    }

    api
      .get<{ data: Order[] }>('/api/customers/orders', {
        headers: { 'x-customer-email': email } as HeadersInit,
      })
      .then((response) => setOrders(response.data))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [email])

  if (!email) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-gray-500">
          Enter your email to view your orders
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            No orders found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{order.product?.name || 'Product'}</h2>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[order.status] || 'bg-gray-50 text-gray-700'}`}
                  >
                    {order.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <p>${Number.parseFloat(order.amount).toFixed(2)} {order.currency}</p>
                    <p className="mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  {order.status === 'COMPLETED' && order.downloadToken && order.product?.fileUrl && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/download/${order.id}/${order.downloadToken}`}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Download
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

export default function CustomerOrdersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <OrdersContent />
      </Suspense>
    </div>
  )
}
