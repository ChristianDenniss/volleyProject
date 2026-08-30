/**
 * Pagination — first/prev/next/last arrows around a "page / totalPages" indicator, always rendered (every control disables itself at a single page) so a list's footer height never jumps.
 * Props: `currentPage`, `totalPages`, `onPageChange`; `compact` drops the first/last arrows for tight toolbars.
 * Lives in `components/ui/navigation/`; `PaginationFooter` in the same folder wraps it in a bordered bottom bar for table pages.
 */
import IconButton from '../buttons/IconButton'

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Hide the jump-to-first/last arrows. */
  compact?: boolean
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  compact = false,
  className = '',
}: Props) {
  const atStart = currentPage <= 1
  const atEnd = currentPage >= totalPages

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center gap-1 ${className}`}
    >
      {!compact && (
        <IconButton
          icon={<span aria-hidden>&laquo;</span>}
          label="First page"
          size="sm"
          disabled={atStart}
          onClick={() => onPageChange(1)}
        />
      )}
      <IconButton
        icon={<span aria-hidden>&lsaquo;</span>}
        label="Previous page"
        size="sm"
        disabled={atStart}
        onClick={() => onPageChange(currentPage - 1)}
      />

      <span aria-live="polite" className="px-2 text-sm tabular-nums text-content-secondary">
        {currentPage} / {Math.max(totalPages, 1)}
      </span>

      <IconButton
        icon={<span aria-hidden>&rsaquo;</span>}
        label="Next page"
        size="sm"
        disabled={atEnd}
        onClick={() => onPageChange(currentPage + 1)}
      />
      {!compact && (
        <IconButton
          icon={<span aria-hidden>&raquo;</span>}
          label="Last page"
          size="sm"
          disabled={atEnd}
          onClick={() => onPageChange(totalPages)}
        />
      )}
    </nav>
  )
}
