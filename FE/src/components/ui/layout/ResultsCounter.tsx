/**
 * ResultsCounter — the "Showing 11–20 of 243 players" line above a paginated list.
 * It derives the visible range from `page`, `pageSize` and `total` rather than taking pre-computed bounds, so the off-by-one at the first and last page is solved once instead of at every call site.
 * Lives in `components/ui/layout/`; pair it with `Pagination` on any paged view.
 */
interface Props {
  page: number
  pageSize: number
  total: number
  /** Plural noun for what is being counted — "players", "games", "registrations". */
  noun: string
  className?: string
}

export default function ResultsCounter({ page, pageSize, total, noun, className = '' }: Props) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <p className={`m-0 text-sm text-content-tertiary ${className}`} aria-live="polite">
      Showing <span className="tabular-nums font-medium text-content-secondary">{first}</span>–
      <span className="tabular-nums font-medium text-content-secondary">{last}</span> of{' '}
      <span className="tabular-nums font-medium text-content-secondary">{total}</span> {noun}
    </p>
  )
}
