/**
 * LoadingSpinner — the app's only spinner: a bordered ring in the current text color, sized by the `size` prop.
 * `PageLoader` (exported from the same file) is the full-page variant used as the route-level Suspense fallback and as a page's early return while its first fetch resolves.
 * Lives in `components/ui/feedback/`; for a loading *layout* (a table or card grid that will fill in) prefer `Skeleton`'s shapes, which don't collapse the page height.
 */

type SpinnerSize = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

interface SpinnerProps {
  size?: SpinnerSize
  /** Accessible label. Set to `null` when a parent already announces the loading state. */
  label?: string | null
  className?: string
}

export default function LoadingSpinner({ size = 'md', label = 'Loading', className = '' }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label ?? undefined}
      className={`inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent ${SIZE_CLASSES[size]} ${className}`}
    />
  )
}

interface PageLoaderProps {
  message?: string
  className?: string
}

export function PageLoader({ message = 'Loading…', className = '' }: PageLoaderProps) {
  return (
    <div
      role="status"
      className={`flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-content-tertiary ${className}`}
    >
      <LoadingSpinner size="lg" label={null} className="text-accent" />
      <p className="m-0 text-sm">{message}</p>
    </div>
  )
}
