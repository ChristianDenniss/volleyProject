/**
 * DataTable — the single table component for every list in the app. It owns the full state machine a list page needs: `loading` renders a SkeletonTable, `error` renders an ErrorNotice, an empty `rows` array renders an EmptyState, and only otherwise does it render the table.
 * Columns are declared as a `DataTableColumn<T>[]` (key, header, render, align, width, sort trigger); `expandedRow` turns any row into an accordion, and `rowTone` tints a row semantically (e.g. an opponent or a forfeited game) without a page-specific class.
 * Lives in `components/ui/layout/`; it replaces both the old `ui/Table` and the per-page `.listing-table` / `.stats-table` CSS, so a page never re-implements loading, empty or zebra striping.
 */
import { Fragment, type ReactNode } from 'react'
import EmptyState from '../feedback/EmptyState'
import ErrorNotice from '../feedback/ErrorNotice'
import { SkeletonTable } from '../feedback/Skeleton'

type ColumnAlign = 'left' | 'center' | 'right'

/** Semantic row tints. A page picks a meaning, not a color. */
export type RowTone = 'default' | 'accent' | 'danger' | 'success' | 'muted'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  /** Cell renderer. Omit to render `String(row[key])`. */
  render?: (row: T, index: number) => ReactNode
  align?: ColumnAlign
  /** Tailwind width utility, e.g. `w-24`. Omit to let the column size to content. */
  width?: string
  /** Makes the header a sort trigger. `sortDirection` draws the active indicator. */
  onSort?: () => void
  sortDirection?: 'asc' | 'desc' | null
  /** Hide below the `md` breakpoint — for columns that don't survive a phone. */
  hideOnMobile?: boolean
}

const ALIGN_CLASSES: Record<ColumnAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const ROW_TONE_CLASSES: Record<RowTone, string> = {
  default: 'bg-surface hover:bg-brand-subtle/50',
  accent:  'bg-brand-subtle/60 hover:bg-brand-subtle',
  danger:  'bg-status-danger/8 hover:bg-status-danger/15',
  success: 'bg-status-success/8 hover:bg-status-success/15',
  muted:   'bg-surface-inset hover:bg-surface-inset',
}

interface Props<T> {
  columns: DataTableColumn<T>[]
  rows: T[] | null | undefined
  rowKey: (row: T) => string | number

  /** Renders the skeleton instead of the table. */
  loading?: boolean
  /** Renders an ErrorNotice instead of the table. */
  error?: string | null
  /** Message for the empty state. */
  emptyLabel?: string
  emptyAction?: ReactNode

  onRowClick?: (row: T, index: number) => void
  rowTone?: (row: T, index: number) => RowTone
  /** Return content to render in a full-width row directly beneath `row`, or null for none. */
  expandedRow?: (row: T, index: number) => ReactNode
  /** Alternating row background. Off by default — on for dense numeric tables. */
  striped?: boolean
  /** Pins the header while the table body scrolls inside its own container. */
  stickyHeader?: boolean
  /** Tightens cell padding for wide stat tables. */
  density?: 'comfortable' | 'compact'
  caption?: string
  className?: string
}

const DENSITY_CLASSES = {
  comfortable: 'px-4 py-3',
  compact: 'px-2.5 py-1.5',
} as const

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyLabel = 'Nothing to show yet.',
  emptyAction,
  onRowClick,
  rowTone,
  expandedRow,
  striped = false,
  stickyHeader = false,
  density = 'comfortable',
  caption,
  className = '',
}: Props<T>) {
  if (loading) return <SkeletonTable rows={8} className={className} />
  if (error) return <ErrorNotice message={error} className={className} />
  if (!rows || rows.length === 0) {
    return <EmptyState label={emptyLabel} action={emptyAction} className={className} />
  }

  const cellPad = DENSITY_CLASSES[density]

  return (
    <div className={`w-full overflow-x-auto rounded-card border border-border bg-surface ${className}`}>
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className={stickyHeader ? 'sticky top-0 z-10' : undefined}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                onClick={col.onSort}
                aria-sort={col.sortDirection ? (col.sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                className={`border-b border-border bg-surface-inset text-xs font-bold uppercase tracking-wide text-accent whitespace-nowrap ${cellPad} ${ALIGN_CLASSES[col.align ?? 'left']} ${col.width ?? ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.onSort ? 'cursor-pointer select-none hover:text-content' : ''}`}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortDirection && (
                    <span aria-hidden className="text-[0.625rem]">
                      {col.sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const expanded = expandedRow?.(row, index)
            const tone = rowTone?.(row, index) ?? 'default'

            return (
              <Fragment key={rowKey(row)}>
                <tr
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                  className={`border-b border-border transition-colors ${ROW_TONE_CLASSES[tone]} ${striped && tone === 'default' && index % 2 === 1 ? 'bg-surface-inset' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`text-content-secondary ${cellPad} ${ALIGN_CLASSES[col.align ?? 'left']} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                    >
                      {col.render
                        ? col.render(row, index)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>

                {expanded && (
                  <tr className="border-b border-border bg-surface-inset">
                    <td colSpan={columns.length} className="px-4 py-4">
                      {expanded}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
