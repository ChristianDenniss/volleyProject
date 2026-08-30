/**
 * EmptyState — the standard "nothing here" placeholder: a centered dashed-border panel with an optional icon, title, description and action.
 * Pass `label` for a one-liner, or `title`/`description`/`icon`/`action` for a richer state; `compact` drops the border and padding for use inside an already-bordered panel such as a table body.
 * Lives in `components/ui/feedback/`; use it instead of writing `<p>No players found.</p>` — there were 26 hand-rolled variants of that line before this component existed.
 */
import type { ReactNode } from 'react'

interface Props {
  /** One-line message. Shorthand for `title` when there's nothing else to show. */
  label?: string
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  /** Drops the dashed border/box padding — use inside an already-bordered panel. */
  compact?: boolean
  className?: string
}

export default function EmptyState({
  label,
  title,
  description,
  icon,
  action,
  compact = false,
  className = '',
}: Props) {
  const heading = title ?? label

  if (compact) {
    return (
      <div className={`py-6 text-center text-sm text-content-muted ${className}`}>{heading}</div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface p-8 text-center ${className}`}
    >
      {icon && <span className="text-3xl text-content-muted">{icon}</span>}
      {heading && (
        <div className="flex flex-col gap-1">
          <p className="m-0 text-sm font-medium text-content">{heading}</p>
          {description && <p className="m-0 text-xs text-content-muted">{description}</p>}
        </div>
      )}
      {action}
    </div>
  )
}
