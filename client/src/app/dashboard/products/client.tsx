'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, ExternalLink, Package } from 'lucide-react'
import { api, ApiClientError } from '@/lib/api-client'
import { formatMoney } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/dashboard/page-header'
import type { Product } from '@/lib/types'

interface Props {
  initial: Product[]
}

export function ProductsClient({ initial }: Props) {
  const router = useRouter()
  const [products, setProducts] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    fileName: string
    fileSize: string
  } | null>(null)

  const editingProduct = editingId ? products.find((p) => p.id === editingId) : null

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
      const res = await api.post<{ data: Product }>('/api/products', {
        name: form.get('name'),
        description: form.get('description') || undefined,
        price: form.get('price'),
        currency: 'USD',
        fileUrl: uploadedFile?.url || undefined,
        fileName: uploadedFile?.fileName || undefined,
        fileSize: uploadedFile?.fileSize || undefined,
      })
      setProducts((prev) => [res.data, ...prev])
      setShowForm(false)
      setUploadedFile(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'We couldn’t create that product. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingId) return
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      const body: Record<string, unknown> = {
        name: form.get('name'),
        description: form.get('description') || undefined,
        price: form.get('price'),
        currency: 'USD',
      }
      if (uploadedFile) {
        body.fileUrl = uploadedFile.url
        body.fileName = uploadedFile.fileName
        body.fileSize = uploadedFile.fileSize
      }
      const res = await api.patch<{ data: Product }>(`/api/products/${editingId}`, body)
      setProducts((prev) => prev.map((p) => (p.id === editingId ? res.data : p)))
      setEditingId(null)
      setUploadedFile(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'We couldn’t save that change. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePublish(id: string, published: boolean) {
    try {
      const res = await api.patch<{ data: Product }>(`/api/products/${id}`, {
        published: !published,
      })
      setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'We couldn’t save that change. Try again.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product? Buyers who already paid keep their download.')) return
    setDeletingId(id)
    setError('')
    try {
      await api.delete(`/api/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'We couldn’t delete that product. Try again.')
    } finally {
      setDeletingId(null)
    }
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/store/${id}`
    void navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function openForm(mode: 'create' | 'edit', product?: Product) {
    setError('')
    setUploadedFile(null)
    if (mode === 'create') {
      setEditingId(null)
      setShowForm(true)
    } else if (product) {
      setShowForm(false)
      setEditingId(product.id)
    }
  }

  const formOpen = showForm || Boolean(editingId)

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <PageHeader
        title="Products"
        description="Everything you have for sale. Publish one and you get a link you can share anywhere."
        actions={
          <Button
            onClick={() => {
              if (formOpen) {
                setShowForm(false)
                setEditingId(null)
                setUploadedFile(null)
              } else {
                openForm('create')
              }
            }}
          >
            {formOpen ? 'Cancel' : 'Add a product'}
          </Button>
        }
      />

      {formOpen && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg text-fg">
              {editingId ? 'Edit product' : 'New product'}
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Upload the exact file a buyer receives the moment they pay.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <Input
                label="Product name"
                name="name"
                required
                defaultValue={editingProduct?.name}
              />
              <Textarea
                label="Description"
                id="description"
                name="description"
                rows={4}
                defaultValue={editingProduct?.description ?? ''}
                placeholder="What they get, who it's for, and what format the file is in."
              />
              <Input
                label="Price (USD)"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={editingProduct?.price}
                hint="Buyers everywhere pay this amount in US dollars."
                className="sm:max-w-xs"
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-fg" htmlFor="product-file">
                  The file buyers receive
                </label>
                <input
                  id="product-file"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleFileUpload(file)
                  }}
                  className="block w-full cursor-pointer text-sm text-fg-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-muted file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-accent-deep hover:file:bg-accent-muted/70"
                />
                <div aria-live="polite">
                  {uploading && <p className="text-sm font-medium text-accent">Uploading…</p>}
                  {uploadedFile && (
                    <p className="text-sm font-medium text-success">
                      Ready: {uploadedFile.fileName} (
                      {(Number(uploadedFile.fileSize) / 1024 / 1024).toFixed(1)} MB)
                    </p>
                  )}
                </div>
                {!uploadedFile && editingProduct?.fileName && (
                  <p className="text-sm text-fg-muted">Current file: {editingProduct.fileName}</p>
                )}
              </div>

              <Button type="submit" size="lg" loading={loading}>
                {editingId ? 'Save changes' : 'Create product'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && !formOpen && (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Nothing for sale yet"
          description="Upload a file, put a price on it, and publish. You can edit everything afterwards."
          action={<Button onClick={() => openForm('create')}>Add your first product</Button>}
          footnote="Free to list. A flat 10% per sale."
        />
      )}

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg text-fg">
              Your products ({products.length})
            </h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Your products">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    File
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Status
                  </th>
                  <th className="px-4 py-3 sm:px-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border-light last:border-0">
                    <td className="px-4 py-3 font-semibold text-fg sm:px-6">{product.name}</td>
                    <td className="tabular px-4 py-3 text-fg-muted sm:px-6">
                      {formatMoney(product.price, product.currency)}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      {product.fileUrl ? (
                        <Badge variant="success">Uploaded</Badge>
                      ) : (
                        <Badge variant="warning">Missing</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      {product.published ? (
                        <Badge variant="success">Live</Badge>
                      ) : (
                        <Badge>Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {product.published && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyLink(product.id)}
                              aria-label="Copy store link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="ml-1 hidden sm:inline" aria-live="polite">
                                {copiedId === product.id ? 'Copied' : 'Link'}
                              </span>
                            </Button>
                            <Button
                              href={`/store/${product.id}`}
                              target="_blank"
                              variant="ghost"
                              size="sm"
                              aria-label="Open store page"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openForm('edit', product)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(product.id, product.published)}
                          disabled={!product.fileUrl && !product.published}
                          title={
                            !product.fileUrl && !product.published
                              ? 'Upload a file before publishing'
                              : undefined
                          }
                        >
                          {product.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletingId === product.id}
                          onClick={() => handleDelete(product.id)}
                        >
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
