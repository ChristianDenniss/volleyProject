/**
 * SectionHeader — the heading row above a block within a page: a title, an optional count and description, and a right-aligned actions slot.
 * Smaller and quieter than PageHeader (which is the page's single `<h1>`); `level` picks the heading tag so a page keeps a valid document outline.
 * Lives in `components/ui/layout/`; use it for "Roster", "Recent games", "Filters" style sub-headings instead of a bare styled `<h2>`.
 */
import type { ReactNode } from 'react'
import CountBadge from '../badges/CountBadge'

interface Props {
  title: ReactNode
  description?: ReactNode
  count?: number
  actions?: ReactNode
  level?: 2 | 3 | 4
  className?: string
}

const LEVEL_CLASSES: Record<2 | 3 | 4, string> = {
  2: 'text-xl font-semibold',
  3: 'text-base font-semibold',
  4: 'text-sm font-semibold uppercase tracking-wide text-content-secondary',
}

export default function SectionHeader({
  title,
  description,
  count,
  actions,
  level = 2,
  className = '',
}: Props) {
  const Heading = `h${level}` as 'h2' | 'h3' | 'h4'

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Heading className={`m-0 text-content ${LEVEL_CLASSES[level]}`}>{title}</Heading>
          {count !== undefined && <CountBadge count={count} size="sm" />}
        </div>
        {description && <p className="m-0 text-xs text-content-tertiary">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
