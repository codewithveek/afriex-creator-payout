'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOutCreator } from '@/lib/queries/session'
import { useCustomerAuth } from '@/components/providers/customer-auth-provider'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import type { Session } from '@/lib/types'

const links = [
  { href: '/discover', label: 'Browse' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/customer/orders', label: 'Your orders' },
]

interface Props {
  /** The signed-in creator, resolved on the server so the header paints right. */
  session?: Session | null
  /** Server-side hint that a buyer session exists, since its token is client-only. */
  buyerHint?: boolean
}

export function SiteHeader({ session = null, buyerHint = false }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const { status: buyerStatus, signOut: signOutBuyer } = useCustomerAuth()

  const creator = session?.user ?? null
  // The buyer token lives in browser storage, so until it has been read the
  // cookie hint stands in for it — otherwise the first paint would show "Log in"
  // to someone who is already signed in.
  const buyer = buyerStatus === 'authenticated' || (buyerStatus === 'loading' && buyerHint)
  const signedIn = Boolean(creator) || buyer

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    setSigningOut(true)
    try {
      if (buyer) signOutBuyer()
      if (creator) {
        await signOutCreator()
        router.refresh()
      }
    } finally {
      setSigningOut(false)
    }
  }

  function accountActions(variant: 'desktop' | 'mobile') {
    const fullWidth = variant === 'mobile'

    if (signedIn) {
      return (
        <>
          <Button
            variant={fullWidth ? 'outline' : 'ghost'}
            size={fullWidth ? 'md' : 'sm'}
            loading={signingOut}
            onClick={handleSignOut}
            className={cn(fullWidth && 'w-full')}
          >
            Sign out
          </Button>
          <Button
            href={creator ? '/dashboard' : '/customer/orders'}
            size={fullWidth ? 'md' : 'sm'}
            onClick={() => setOpen(false)}
            className={cn(fullWidth && 'w-full')}
          >
            {creator ? 'Dashboard' : 'Your orders'}
          </Button>
        </>
      )
    }

    return (
      <>
        <Button
          href="/login"
          variant={fullWidth ? 'outline' : 'ghost'}
          size={fullWidth ? 'md' : 'sm'}
          onClick={() => setOpen(false)}
          className={cn(fullWidth && 'w-full')}
        >
          Log in
        </Button>
        <Button
          href="/signup"
          size={fullWidth ? 'md' : 'sm'}
          onClick={() => setOpen(false)}
          className={cn(fullWidth && 'w-full')}
        >
          Start selling
        </Button>
      </>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
          aria-label="Afriex Creators, home"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150',
                  active
                    ? 'bg-accent-muted text-accent-deep'
                    : 'text-fg-muted hover:bg-bg-muted hover:text-fg',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{accountActions('desktop')}</div>

        <button
          type="button"
          className="-mr-2 rounded-lg p-2.5 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-bg px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {accountActions('mobile')}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
