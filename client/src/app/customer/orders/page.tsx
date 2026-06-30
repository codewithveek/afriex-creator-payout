'use client'

import { Suspense, useEffect, useState } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Order, Customer } from '@/lib/types'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  COMPLETED: 'bg-green-50 text-green-700',
  REFUNDED: 'bg-red-50 text-red-700',
  FAILED: 'bg-gray-50 text-gray-700',
}

function OrdersContent() {
  const [token, setToken] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signingUp, setSigningUp] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('customerToken')
    if (saved) {
      setToken(saved)
    }
  }, [])

  // Fetch orders when token is set
  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError('')

    api
      .get<{ data: Order[] }>('/api/customers/orders', {
        headers: { 'x-customer-token': token } as HeadersInit,
      })
      .then((response) => setOrders(response.data))
      .catch((err) => {
        if (err instanceof ApiClientError && err.status === 401) {
          sessionStorage.removeItem('customerToken')
          setToken(null)
        }
        setError(err instanceof ApiClientError ? err.message : 'Failed to load orders')
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    try {
      const res = await api.post<{ data: Customer }>('/api/customers/login', {
        email: form.get('email'),
        password: form.get('password'),
      })
      const customerToken = res.data.token
      if (customerToken) {
        sessionStorage.setItem('customerToken', customerToken)
        setToken(customerToken)
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    try {
      await api.post('/api/customers/signup', {
        email: form.get('email'),
        name: form.get('name'),
        password: form.get('password'),
      })
      setSigningUp(false)
      // Auto-login after signup
      const res = await api.post<{ data: Customer }>('/api/customers/login', {
        email: form.get('email'),
        password: form.get('password'),
      })
      const customerToken = res.data.token
      if (customerToken) {
        sessionStorage.setItem('customerToken', customerToken)
        setToken(customerToken)
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('customerToken')
    setToken(null)
    setOrders([])
  }

  // Login / Signup form when not authenticated
  if (!token) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {signingUp ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Create an account</h2>
              <p className="text-sm text-gray-500">Sign up to view and download your orders</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <Input label="Name" name="name" required />
                <Input label="Email" name="email" type="email" required />
                <Input label="Password" name="password" type="password" required minLength={8} />
                <Button type="submit" loading={loading}>
                  Sign up
                </Button>
              </form>
              <p className="mt-4 text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={() => setSigningUp(false)} className="text-blue-600 hover:underline">
                  Log in
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Log in</h2>
              <p className="text-sm text-gray-500">Enter your email and password to view your orders</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input label="Email" name="email" type="email" required />
                <Input label="Password" name="password" type="password" required />
                <Button type="submit" loading={loading}>
                  Log in
                </Button>
              </form>
              <p className="mt-4 text-sm text-gray-500">
                No account?{' '}
                <button onClick={() => setSigningUp(true)} className="text-blue-600 hover:underline">
                  Sign up
                </button>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </button>
      </div>

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
