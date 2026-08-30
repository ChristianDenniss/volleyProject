/**
 * CardGrid — the auto-filling responsive grid every card listing sits in (teams, seasons, awards, articles), sized by a `minColumnWidth` rather than a fixed column count so it reflows at any width without breakpoints.
 * It owns the same three states as DataTable — `loading` renders a matching SkeletonCardGrid, `error` an ErrorNotice, an empty list an EmptyState — so a card page never re-implements them either.
 * Lives in `components/ui/layout/`; pass `Card`s (or any tiles) as children.
 */
import type { ReactNode } from 'react'
import EmptyState from '../feedback/EmptyState'
import ErrorNotice from '../feedback/ErrorNotice'
import { SkeletonCardGrid } from '../feedback/Skeleton'

type ColumnWidth = 'sm' | 'md' | 'lg'

/** Minimum tile width before the grid drops a column. Named rather than numeric so the
 *  app has three card scales, not fifteen. */
const MIN_WIDTH_CLASSES: Record<ColumnWidth, string> = {
  sm: 'grid-cols-[repeat(auto-fill,minmax(180px,1fr))]',
  md: 'grid-cols-[repeat(auto-fill,minmax(260px,1fr))]',
  lg: 'grid-cols-[repeat(auto-fill,minmax(340px,1fr))]',
}

interface Props {
  children: ReactNode
  minColumnWidth?: ColumnWidth
  loading?: boolean
  error?: string | null
  /** Number of skeleton tiles to show while loading — match the page size. */
  loadingCount?: number
  /** Height utility for the skeleton tiles, so the layout doesn't jump when data lands. */
  loadingHeight?: string
  /** True when there is nothing to render; drives the empty state. */
  isEmpty?: boolean
  emptyLabel?: string
  emptyAction?: ReactNode
  className?: string
}

export default function CardGrid({
  children,
  minColumnWidth = 'md',
  loading = false,
  error = null,
  loadingCount = 12,
  loadingHeight = 'h-44',
  isEmpty = false,
  emptyLabel = 'Nothing to show yet.',
  emptyAction,
  className = '',
}: Props) {
  if (loading) {
    return <SkeletonCardGrid count={loadingCount} height={loadingHeight} className={className} />
  }
  if (error) return <ErrorNotice message={error} className={className} />
  if (isEmpty) return <EmptyState label={emptyLabel} action={emptyAction} className={className} />

  return <div className={`grid gap-4 ${MIN_WIDTH_CLASSES[minColumnWidth]} ${className}`}>{children}</div>
}
