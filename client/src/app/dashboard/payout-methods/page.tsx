import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { PayoutMethod } from '@/lib/types'
import { PayoutMethodsClient } from './client'

async function getPayoutMethods(cookie: string | null) {
  try {
    return await apiFetch<{ data: PayoutMethod[] }>('/api/payout-methods', { cookie })
  } catch {
    return { data: [] }
  }
}

async function PayoutMethodsContent() {
  const cookie = cookies().toString() || null
  const { data: methods } = await getPayoutMethods(cookie)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payout Methods</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your bank accounts for receiving payouts</p>
      </div>

      <PayoutMethodsClient initial={methods} />

      {methods.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Saved Accounts</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Bank</th>
                  <th className="px-6 py-3 font-medium">Currency</th>
                  <th className="px-6 py-3 font-medium">Default</th>
                  <th className="px-6 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 text-gray-900">
                      {(method.details as { bankName?: string })?.bankName || '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{method.currency}</td>
                    <td className="px-6 py-3">
                      {method.isDefault ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Default
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(method.createdAt).toLocaleDateString()}
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

export default function PayoutMethodsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <PayoutMethodsContent />
    </Suspense>
  )
}
