'use client'

import { forwardRef } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'signal' | 'secondary' | 'outline' | 'outline-inverse' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  /** Renders an anchor styled as a button. Avoids invalid <a><button> nesting. */
  href?: string
  target?: string
}

const variants = {
  primary:
    'bg-accent text-fg-on-accent shadow-sm hover:bg-accent-hover active:translate-y-px focus-visible:ring-accent disabled:opacity-50',
  signal:
    'bg-signal text-fg shadow-sm hover:bg-signal-hover active:translate-y-px focus-visible:ring-signal disabled:opacity-50',
  secondary:
    'bg-bg-subtle text-fg hover:bg-border active:translate-y-px focus-visible:ring-accent',
  outline:
    'border border-border bg-bg-elevated text-fg hover:border-fg-subtle hover:bg-bg-muted active:translate-y-px focus-visible:ring-accent',
  'outline-inverse':
    'border border-border-inverse bg-transparent text-fg-on-inverse hover:bg-bg-inverse-soft active:translate-y-px focus-visible:ring-signal',
  ghost: 'text-fg-muted hover:bg-bg-muted hover:text-fg focus-visible:ring-accent',
  danger: 'bg-error text-fg-on-accent hover:opacity-90 focus-visible:ring-error disabled:opacity-50',
}

const sizes = {
  sm: 'min-h-9 px-3.5 py-1.5 text-sm',
  md: 'min-h-11 px-4.5 py-2 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
}

function Spinner() {
  return (
    <svg
      className="-ml-1 mr-2 h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, href, target, children, ...props }, ref) => {
    const classes = clsx(
      'inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-[background-color,border-color,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none',
      variants[variant],
      sizes[size],
      className,
    )

    if (href) {
      const { type: _type, ...anchorProps } = props
      void _type
      return (
        <Link
          href={href}
          target={target}
          className={classes}
          {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
