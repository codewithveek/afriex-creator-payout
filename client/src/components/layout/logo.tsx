import { cn } from '@/lib/utils'

interface Props {
  /** `ink` for light surfaces, `light` for ink surfaces. */
  tone?: 'ink' | 'light'
  className?: string
  markClassName?: string
  /** Hide the wordmark, keeping only the mark. */
  markOnly?: boolean
}

/**
 * The mark is a two-way exchange: a file going down to a buyer, money going up
 * to a creator. Both sides of the marketplace in one glyph.
 */
export function Logo({ tone = 'ink', className, markClassName, markOnly }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem]',
          tone === 'ink' ? 'bg-accent text-fg-on-accent' : 'bg-signal text-fg',
          markClassName,
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M8.5 4v9m0 0 3-3m-3 3-3-3"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 20v-9m0 0 3 3m-3-3-3 3"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!markOnly && (
        <span
          className={cn(
            'font-display text-[1.0625rem] leading-none tracking-tight',
            tone === 'ink' ? 'text-fg' : 'text-fg-on-inverse',
          )}
        >
          Afriex{' '}
          <span className={tone === 'ink' ? 'text-fg-muted' : 'text-fg-on-inverse-muted'}>
            Creators
          </span>
        </span>
      )}
    </span>
  )
}
