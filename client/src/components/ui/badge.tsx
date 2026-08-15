import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-bg-subtle text-fg-muted',
  accent: 'bg-accent-muted text-accent-deep',
  signal: 'bg-signal-muted text-signal-deep',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  error: 'bg-error-muted text-error',
  info: 'bg-info-muted text-info',
  inverse: 'bg-bg-inverse-soft text-fg-on-inverse',
} as const

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
