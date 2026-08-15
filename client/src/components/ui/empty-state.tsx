import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  /** Optional secondary hint rendered under the action, e.g. what happens next. */
  footnote?: string
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  footnote,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-muted/70 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg text-fg">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
      {footnote && <p className="mt-3 text-xs text-fg-muted">{footnote}</p>}
    </div>
  )
}
