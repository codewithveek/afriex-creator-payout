'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Landmark } from 'lucide-react'
import type { PayoutMethod } from '@/lib/types'

/** Payout currencies. Products are always priced in USD; payouts convert to this. */
const payoutCurrencies = ['USD', 'NGN', 'GHS', 'KES'] as const

interface Props {
  initial: PayoutMethod[]
}

export function PayoutMethodsClient({ initial }: Props) {
  const router = useRouter()
  const [methods, setMethods] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      await api.post('/api/payout-methods', {
        accountNumber: form.get('accountNumber'),
        bankCode: form.get('bankCode'),
        bankName: form.get('bankName'),
        currency: 'USD',
      })
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t save that account. Check the details and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    setError('')
    try {
      await api.delete(`/api/payout-methods/${id}`)
      setMethods((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'We couldn’t remove that account.',
      )
    } finally {
      setDeleting(null)
      setConfirmingId(null)
    }
  }

  const formContent = (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg text-fg">Add a bank account</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Use an account in your own name that can receive US dollars. It&apos;s stored encrypted
          and never shown to buyers.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <Input label="Account number" name="accountNumber" required inputMode="numeric" />
          <Input
            label="Bank code"
            name="bankCode"
            required
            hint="The sort or bank code your bank uses for transfers."
          />
          <Input label="Bank name" name="bankName" required />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" loading={loading}>
              Save this account
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

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

      {methods.length === 0 && !showForm && (
        <EmptyState
          icon={<Landmark className="h-6 w-6" />}
          title="No bank account on file"
          description="Add one now so it's verified before your first withdrawal."
          action={<Button onClick={() => setShowForm(true)}>Add a bank account</Button>}
          footnote="Stored encrypted. Never shown to buyers."
        />
      )}

      {showForm && formContent}

      {methods.length > 0 && (
        <Button
          variant="outline"
          onClick={() => {
            setShowForm(!showForm)
            setError('')
          }}
        >
          {showForm ? 'Cancel' : 'Add another account'}
        </Button>
      )}

      {methods.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg text-fg">Saved accounts</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Saved payout methods">
              <thead>
                <tr className="border-b border-border-light text-left text-fg-muted">
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Bank
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Currency
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Default
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Added
                  </th>
                  <th className="px-4 py-3 sm:px-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id} className="border-b border-border-light last:border-0">
                    <td className="px-4 py-3 sm:px-6">
                      <span className="font-semibold text-fg">
                        {method.bankName ||
                          (method.details as { bankName?: string })?.bankName ||
                          'Bank account'}
                      </span>
                      {method.maskedAccountNumber && (
                        <span className="tabular mt-0.5 block text-xs text-fg-muted">
                          {method.maskedAccountNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fg-muted sm:px-6">{method.currency}</td>
                    <td className="px-4 py-3 sm:px-6">
                      {method.isDefault ? (
                        <Badge variant="accent">Default</Badge>
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fg-muted sm:px-6">
                      {new Date(method.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      {confirmingId === method.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            loading={deleting === method.id}
                            onClick={() => handleDelete(method.id)}
                          >
                            Yes, remove it
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deleting === method.id}
                            onClick={() => setConfirmingId(null)}
                          >
                            Keep
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setConfirmingId(method.id)
                            setError('')
                          }}
                        >
                          Remove
                        </Button>
                      )}
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
