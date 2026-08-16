import { Suspense } from 'react'
import { apiFetch } from '@/lib/api-client'
import { getCookieHeader } from '@/lib/cookies'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/dashboard/page-header'
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
  const cookie = await getCookieHeader()
  const { data: methods } = await getPayoutMethods(cookie)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bank accounts"
        description="Where your earnings land when you cash out. Add an account once and every withdrawal after that is a single click."
      />
      <PayoutMethodsClient initial={methods} />
    </div>
  )
}

export default function PayoutMethodsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      }
    >
      <PayoutMethodsContent />
    </Suspense>
  )
}
