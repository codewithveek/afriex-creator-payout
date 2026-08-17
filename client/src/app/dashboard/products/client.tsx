'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, ExternalLink, Package } from 'lucide-react'
import { api, ApiClientError } from '@/lib/api-client'
import { formatMoney, formatFileSize } from '@/lib/utils'
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
  const [uploadError, setUploadError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  /**
   * The chosen file is held here and only sent when the creator saves. Picking
   * a file is not a commitment — uploading on change burns their data on a
   * form they might abandon, and leaves orphaned files behind when they do.
   */
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const editingProduct = editingId ? products.find((p) => p.id === editingId) : null

  /** Uploads the pending file. Throws with a readable message on failure. */
  async function uploadSelectedFile(
    file: File,
  ): Promise<{ url: string; fileName: string; fileSize: string }> {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/upload/product-file`,
        { method: 'POST', credentials: 'include', body: formData },
      )

      // The body is not always JSON — a proxy rejecting an oversized upload
      // replies with HTML, and blindly calling res.json() would swallow the
      // real reason and report a parse error instead.
      const text = await res.text()
      let payload: { data?: { url: string; fileName: string; fileSize: string }; error?: { message?: string } } = {}
      try {
        payload = text ? JSON.parse(text) : {}
      } catch {
        payload = {}
      }

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error(`“${file.name}” is too large to upload. Try a smaller file.`)
        }
        throw new Error(
          payload.error?.message || `Upload failed (${res.status}). Try again in a moment.`,
        )
      }
      if (!payload.data?.url) {
        throw new Error('The upload finished but no file came back. Try again.')
      }
      return payload.data
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error('The upload could not reach the server. Check your connection and retry.')
      }
      throw err
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUploadError('')
    const form = new FormData(e.currentTarget)

    let uploaded: { url: string; fileName: string; fileSize: string } | null = null
    if (selectedFile) {
      try {
        uploaded = await uploadSelectedFile(selectedFile)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed.')
        setLoading(false)
        return
      }
    }

    try {
      const res = await api.post<{ data: Product }>('/api/products', {
        name: form.get('name'),
        description: form.get('description') || undefined,
        price: form.get('price'),
        currency: 'USD',
        fileUrl: uploaded?.url || undefined,
        fileName: uploaded?.fileName || undefined,
        fileSize: uploaded?.fileSize || undefined,
      })
      setProducts((prev) => [res.data, ...prev])
      setShowForm(false)
      setSelectedFile(null)
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
    setUploadError('')
    const form = new FormData(e.currentTarget)

    let uploaded: { url: string; fileName: string; fileSize: string } | null = null
    if (selectedFile) {
      try {
        uploaded = await uploadSelectedFile(selectedFile)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed.')
        setLoading(false)
        return
      }
    }

    try {
      const body: Record<string, unknown> = {
        name: form.get('name'),
        description: form.get('description') || undefined,
        price: form.get('price'),
        currency: 'USD',
      }
      if (uploaded) {
        body.fileUrl = uploaded.url
        body.fileName = uploaded.fileName
        body.fileSize = uploaded.fileSize
      }
      const res = await api.patch<{ data: Product }>(`/api/products/${editingId}`, body)
      setProducts((prev) => prev.map((p) => (p.id === editingId ? res.data : p)))
      setEditingId(null)
      setSelectedFile(null)
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
    setSelectedFile(null)
    setUploadError('')
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
                setSelectedFile(null)
    setUploadError('')
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
                  aria-describedby={uploadError ? 'product-file-error' : undefined}
                  aria-invalid={uploadError ? 'true' : undefined}
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] ?? null)
                    setUploadError('')
                  }}
                  className="block w-full cursor-pointer text-sm text-fg-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-muted file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-accent-deep hover:file:bg-accent-muted/70"
                />

                <div aria-live="polite">
                  {selectedFile && !uploadError && (
                    <p className="text-sm text-fg-muted">
                      {uploading
                        ? `Uploading ${selectedFile.name}…`
                        : `${selectedFile.name} (${formatFileSize(selectedFile.size)}) uploads when you save.`}
                    </p>
                  )}
                  {uploadError && (
                    <p
                      id="product-file-error"
                      role="alert"
                      className="rounded-lg border border-error/30 bg-error-muted p-3 text-sm font-medium text-error"
                    >
                      {uploadError}
                    </p>
                  )}
                </div>

                {!selectedFile && editingProduct?.fileName && (
                  <p className="text-sm text-fg-muted">Current file: {editingProduct.fileName}</p>
                )}
              </div>

              <Button type="submit" size="lg" loading={loading}>
                {uploading
                  ? 'Uploading…'
                  : editingId
                    ? 'Save changes'
                    : 'Create product'}
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
