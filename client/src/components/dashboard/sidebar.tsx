'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  ArrowUpRight,
  Package,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { Logo } from '@/components/layout/logo'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/earnings', label: 'Earnings', icon: Wallet },
  { href: '/dashboard/withdrawals', label: 'Cash out', icon: ArrowUpRight },
  { href: '/dashboard/payout-methods', label: 'Bank accounts', icon: Landmark },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const adminItems = [{ href: '/dashboard/admin', label: 'Admin', icon: Shield }]

interface Props {
  role: 'CREATOR' | 'ADMIN'
}

export function Sidebar({ role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  async function handleLogout() {
    await api.post('/api/auth/logout')
    router.push('/login')
    router.refresh()
  }

  const linkClass = (isActive: boolean, tone: 'default' | 'admin' = 'default') =>
    clsx(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
      isActive
        ? tone === 'admin'
          ? 'bg-warning-muted text-warning'
          : 'bg-signal text-fg'
        : 'text-sidebar-fg-muted hover:bg-sidebar-hover hover:text-sidebar-fg',
    )

  const nav = (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-sidebar-bg"
          aria-label="Afriex Creators, home"
        >
          <Logo tone="light" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Dashboard">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive ? 'page' : undefined}
              className={linkClass(isActive)}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          )
        })}

        {role === 'ADMIN' && (
          <>
            <p className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-sidebar-fg-muted">
              Platform
            </p>
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={linkClass(isActive, 'admin')}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-sidebar-border p-4">
        <Link
          href="/discover"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-fg-muted transition-colors duration-150 hover:bg-sidebar-hover hover:text-sidebar-fg"
        >
          <Store className="h-5 w-5" aria-hidden />
          View the marketplace
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-fg-muted transition-colors duration-150 hover:bg-sidebar-hover hover:text-sidebar-fg"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar-bg px-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
          className="rounded-lg p-2.5 text-sidebar-fg-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-fg"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Logo tone="light" markClassName="h-8 w-8" />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-60 bg-fg/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-70 flex w-72 flex-col bg-sidebar-bg transition-transform duration-200 ease-out lg:static lg:w-64 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {nav}
      </aside>
    </>
  )
}
