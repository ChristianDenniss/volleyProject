/**
 * Toolbar — the controls strip above a listing: filters on the left, search and pagination pushed to the right, wrapping to stacked rows on narrow screens.
 * Takes a `filters` slot and a `trailing` slot rather than raw children, so every list page puts its controls in the same order without re-deriving the flex/wrap rules.
 * Lives in `components/ui/layout/`; replaces the per-page `.listing-controls-toolbar` wrappers.
 */
import type { ReactNode } from 'react'

interface Props {
  /** Left group — selects, filter chips, tabs. Grows to fill available space. */
  filters?: ReactNode
  /** Right group — search box, pagination, primary action. Pinned right on wide screens. */
  trailing?: ReactNode
  className?: string
}

export default function Toolbar({ filters, trailing, className = '' }: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {filters && <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{filters}</div>}
      {trailing && (
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:ml-auto">{trailing}</div>
      )}
    </div>
  )
}
