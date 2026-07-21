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
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{ url: string; fileName: string; fileSize: string } | null>(null)

  async function handleFileUpload(file: File) {
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/upload/product-file`,
        { method: 'POST', credentials: 'include', body: formData },
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Upload failed')
      }
      const json = await res.json()
      setUploadedFile(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

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
        fileUrl: uploadedFile?.url || undefined,
        fileName: uploadedFile?.fileName || undefined,
        fileSize: uploadedFile?.fileSize || undefined,
      })
      setShowForm(false)
      setUploadedFile(null)
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
    setDeletingId(id)
    setError('')
    try {
      await api.delete(`/api/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-error-muted p-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Products</h1>
          <p className="mt-1 text-sm text-fg-muted">Manage your digital products</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setUploadedFile(null) }}>
          {showForm ? 'Cancel' : 'Add product'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">New Product</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Product Name" name="name" required />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-fg-muted" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="block w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Price" name="price" type="number" step="0.01" min="0" required />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-fg-muted" htmlFor="currency">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    className="block w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
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

              <div className="space-y-1">
                <label className="block text-sm font-medium text-fg-muted">Product File</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className="block w-full text-sm text-fg-muted file:mr-4 file:rounded-lg file:border-0 file:bg-accent-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent-muted/80"
                />
                {uploading && <p className="text-sm text-accent">Uploading...</p>}
                {uploadedFile && (
                  <p className="text-sm text-success">
                    Uploaded: {uploadedFile.fileName} ({(Number(uploadedFile.fileSize) / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
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
          <CardContent className="py-12 text-center text-sm text-fg-muted">
            No products yet. Create your first digital product to start selling.
          </CardContent>
        </Card>
      )}

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">Your Products ({products.length})</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Your products">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th className="px-4 sm:px-6 py-3 font-medium">Name</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Price</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">File</th>
                  <th className="px-4 sm:px-6 py-3 font-medium">Status</th>
                  <th className="px-4 sm:px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border-light last:border-0">
                    <td className="px-4 sm:px-6 py-3 font-medium text-fg">{product.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-fg-muted">
                      ${Number.parseFloat(product.price).toFixed(2)} {product.currency}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      {product.fileUrl ? (
                        <span className="inline-flex items-center rounded-full bg-success-muted px-2 py-0.5 text-xs font-medium text-success">
                          Has file
                        </span>
                      ) : (
                        <span className="text-xs text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      {product.published ? (
                        <span className="inline-flex items-center rounded-full bg-success-muted px-2 py-0.5 text-xs font-medium text-success">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-bg-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(product.id, product.published)}
                        >
                          {product.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button variant="danger" size="sm" loading={deletingId === product.id} onClick={() => handleDelete(product.id)}>
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
    </div>
  )
}
