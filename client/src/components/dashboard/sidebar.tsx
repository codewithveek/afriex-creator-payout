'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { LayoutDashboard, Wallet, Banknote, ArrowUpRight, Package, Settings, Shield, LogOut, Menu, X } from 'lucide-react'
import { api } from '@/lib/api-client'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/earnings', label: 'Earnings', icon: Wallet },
  { href: '/dashboard/payout-methods', label: 'Payout Methods', icon: Banknote },
  { href: '/dashboard/withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const adminItems = [
  { href: '/dashboard/admin', label: 'Admin', icon: Shield },
]

interface Props {
  role: 'CREATOR' | 'ADMIN'
}

export function Sidebar({ role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await api.post('/api/auth/logout')
    router.push('/login')
    router.refresh()
  }

  const nav = (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="text-sm font-bold text-fg-on-accent">A</span>
        </div>
        <span className="text-lg font-semibold text-fg">Creator Payout</span>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-muted text-accent'
                  : 'text-fg-muted hover:bg-bg-muted hover:text-fg',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
        {role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-fg-muted">
                Admin
              </p>
            </div>
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-warning-muted text-warning'
                      : 'text-fg-muted hover:bg-bg-muted hover:text-fg',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-sidebar-border bg-sidebar-bg px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          className="rounded-lg p-2 text-fg-muted hover:bg-bg-muted"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
          <span className="text-xs font-bold text-fg-on-accent">A</span>
        </div>
        <span className="text-base font-semibold text-fg">Creator Payout</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar-bg transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {nav}
      </aside>
    </>
  )
}
