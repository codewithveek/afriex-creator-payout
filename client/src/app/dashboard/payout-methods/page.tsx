import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'
import { Skeleton } from '@/components/ui/skeleton'
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
        <h1 className="text-2xl font-semibold text-fg">Payout Methods</h1>
        <p className="mt-1 text-sm text-fg-muted">Manage your bank accounts for receiving payouts</p>
      </div>

      <PayoutMethodsClient initial={methods} />
    </div>
  )
}

export default function PayoutMethodsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    }>
      <PayoutMethodsContent />
    </Suspense>
  )
}
