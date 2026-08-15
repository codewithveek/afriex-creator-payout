'use client'

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-fg">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'block min-h-11 w-full appearance-none rounded-lg border bg-bg-elevated py-2 pl-3.5 pr-9 text-sm text-fg transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0',
              error
                ? 'border-error focus:border-error focus:ring-error/40'
                : 'border-border focus:border-accent focus:ring-accent/35',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
        </div>
        {hint && !error && <p className="text-xs text-fg-muted">{hint}</p>}
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
