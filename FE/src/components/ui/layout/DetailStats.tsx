/**
 * DetailStats — a responsive definition list of term/value pairs, for the label-and-figure blocks inside expanded table rows, detail panels and profile summaries.
 * Takes `items: { label, value, wide? }[]`; `wide` makes an entry span the full grid row for a long value such as "Seasons played". `columns` sets the target column count on wide screens.
 * Lives in `components/ui/layout/`; it replaces the per-page `<dl className="xyz-detail-stats">` blocks that each redefined the same grid.
 */
import type { ReactNode } from 'react'

export interface DetailStatItem {
  label: ReactNode
  value: ReactNode
  /** Span the full width of the grid — for long prose values. */
  wide?: boolean
}

interface Props {
  items: DetailStatItem[]
  columns?: 2 | 3 | 4 | 6
  className?: string
}

const COLUMN_CLASSES: Record<2 | 3 | 4 | 6, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
}

export default function DetailStats({ items, columns = 4, className = '' }: Props) {
  return (
    <dl className={`m-0 grid grid-cols-1 gap-4 ${COLUMN_CLASSES[columns]} ${className}`}>
      {items.map((item, i) => (
        <div key={i} className={`flex flex-col gap-0.5 ${item.wide ? 'col-span-full' : ''}`}>
          <dt className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
            {item.label}
          </dt>
          <dd className="m-0 text-sm font-semibold text-content">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
