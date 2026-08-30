/**
 * Skeleton — the shimmer placeholder primitive, plus the three composed shapes the app actually loads into: SkeletonText, SkeletonTable and SkeletonCardGrid.
 * The shimmer gradient and animation are defined once here (over the `--surface-inset` / `--brand-50` tokens); callers pick a shape and a count, never an animation.
 * Lives in `components/ui/feedback/`; use one of these instead of writing an `animate-pulse` div or a page-specific `.xyz-skeleton-row` class.
 */

const SHIMMER =
  'bg-[linear-gradient(90deg,var(--surface-inset)_25%,var(--brand-50)_50%,var(--surface-inset)_75%)] bg-[length:200%_100%] animate-[skeleton-shimmer_1.4s_ease-in-out_infinite]'

interface SkeletonProps {
  className?: string
}

/** The bare shimmer block. Size it with utilities: `<Skeleton className="h-4 w-32" />`. */
export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={`rounded-control ${SHIMMER} ${className}`} />
}

interface SkeletonTextProps {
  /** Number of lines. The last line is rendered short so the block reads as prose. */
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  /** Renders a taller first bar standing in for the header row. */
  withHeader?: boolean
  className?: string
}

export function SkeletonTable({ rows = 10, withHeader = true, className = '' }: SkeletonTableProps) {
  return (
    <div
      role="status"
      aria-label="Loading table"
      className={`overflow-hidden rounded-card border border-border ${className}`}
    >
      {withHeader && <Skeleton className="h-10 !rounded-none" />}
      <div className="flex flex-col gap-px bg-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-surface p-3">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface SkeletonCardGridProps {
  count?: number
  /** Height of each card placeholder — match the real card so the layout doesn't jump. */
  height?: string
  className?: string
}

export function SkeletonCardGrid({
  count = 6,
  height = 'h-40',
  className = '',
}: SkeletonCardGridProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))] ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} !rounded-card`} />
      ))}
    </div>
  )
}
