'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-accent text-fg-on-accent hover:bg-accent-hover focus-visible:ring-accent disabled:opacity-50',
  secondary: 'bg-bg-muted text-fg hover:bg-bg-subtle focus-visible:ring-border',
  outline: 'border border-border bg-bg text-fg-muted hover:bg-bg-muted focus-visible:ring-accent',
  ghost: 'text-fg-muted hover:bg-bg-muted focus-visible:ring-border',
  danger: 'bg-error text-fg-on-accent hover:opacity-90 focus-visible:ring-error disabled:opacity-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <svg
            className="-ml-1 mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
