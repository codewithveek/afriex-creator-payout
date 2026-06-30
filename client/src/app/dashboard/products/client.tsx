'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Product } from '@/lib/types'

const currencies = ['USD', 'NGN', 'GHS', 'KES'] as const

interface Props {
  initial: Product[]
}

export function ProductsClient({ initial }: Props) {
  const router = useRouter()
  const [products, setProducts] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      await api.post('/api/products', {
        name: form.get('name'),
        description: form.get('description'),
        price: form.get('price'),
        currency: form.get('currency'),
      })
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePublish(id: string, published: boolean) {
    try {
      await api.patch(`/api/products/${id}`, { published: !published })
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, published: !published } : p)))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update product')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this product?')) return
    try {
      await api.delete(`/api/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete product')
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your digital products</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add product'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">New Product</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Product Name" name="name" required />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price" name="price" type="number" step="0.01" min="0" required />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="currency">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" loading={loading}>
                Create product
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            No products yet. Create your first digital product to start selling.
          </CardContent>
        </Card>
      )}

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Your Products ({products.length})</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Sales</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-3 text-gray-700">
                      ${Number.parseFloat(product.price).toFixed(2)} {product.currency}
                    </td>
                    <td className="px-6 py-3">
                      {product.published ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{(product as Product & { orderCount?: number }).orderCount ?? '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(product.id, product.published)}
                        >
                          {product.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(product.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
