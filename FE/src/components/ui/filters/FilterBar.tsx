/**
 * FilterBar — the horizontal group of filter controls above a list, with a "Reset" button that only appears when at least one filter is active.
 * Pass the controls as children (usually `FilterSelect`s) and an `onReset`; `activeCount` drives both the reset button's visibility and the count badge, so a page never re-derives "are any filters on?".
 * Lives in `components/ui/filters/`; drop it into `layout/Toolbar`'s `filters` slot rather than laying filters out by hand.
 */
import type { ReactNode } from 'react'
import Button from '../buttons/Button'
import CountBadge from '../badges/CountBadge'

interface Props {
  children: ReactNode
  onReset?: () => void
  /** How many filters are currently applied. Omit to always show the reset button. */
  activeCount?: number
  className?: string
}

export default function FilterBar({ children, onReset, activeCount, className = '' }: Props) {
  const showReset = onReset && (activeCount === undefined || activeCount > 0)

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-2 ${className}`}>
      {children}
      {showReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
          {activeCount !== undefined && activeCount > 0 && (
            <CountBadge count={activeCount} size="sm" color="accent" />
          )}
        </Button>
      )}
    </div>
  )
}
