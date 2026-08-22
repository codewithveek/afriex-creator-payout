'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ApiClientError } from '@/lib/api-client'
import { renewLibraryDownload } from '@/lib/queries/orders'
import { Button } from '@/components/ui/button'

/**
 * The only interactive part of the library: issuing a fresh download link.
 * The list itself is server-rendered from the session, so there is nothing to
 * hydrate and nothing to get out of sync with the header.
 */
export function RenewDownloadButton({
  orderId,
  children,
}: {
  orderId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [renewing, setRenewing] = useState(false)
  const [error, setError] = useState('')

  async function handleRenew() {
    setRenewing(true)
    setError('')
    try {
      await renewLibraryDownload(orderId)
      startTransition(() => router.refresh())
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'We couldn’t issue a new link. Try again in a moment.',
      )
    } finally {
      setRenewing(false)
    }
  }

  return (
    <div className="sm:text-right">
      <Button variant="outline" loading={renewing || pending} onClick={handleRenew}>
        {children}
      </Button>
      {error && (
        <p className="mt-2 text-sm font-medium text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
