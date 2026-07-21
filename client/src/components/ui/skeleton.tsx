import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx('animate-pulse rounded-md bg-bg-subtle', className)}
      aria-hidden="true"
    />
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6" aria-label="Loading table data" role="status">
      <div className="flex gap-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg p-6" aria-label="Loading card" role="status">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  )
}
