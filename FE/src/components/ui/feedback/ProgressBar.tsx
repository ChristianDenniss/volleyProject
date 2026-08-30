/**
 * ProgressBar — a labelled horizontal progress track for a 0–100 value (Hall of Fame progress, an upload, a completion rate).
 * `tone` colours the fill semantically, and the element carries the ARIA progressbar role with its value, so the number is available to a screen reader and not only to the eye.
 * Lives in `components/ui/feedback/`; for an indeterminate wait use `LoadingSpinner` instead — a bar that can't report progress is worse than a spinner.
 */
type ProgressTone = 'accent' | 'success' | 'warning' | 'danger' | 'gold'

const TONE_CLASSES: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  gold: 'bg-status-gold',
}

interface Props {
  /** 0–100. Values outside the range are clamped. */
  value: number
  tone?: ProgressTone
  /** Accessible name, e.g. "Hall of Fame progress". */
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export default function ProgressBar({
  value,
  tone = 'accent',
  label,
  size = 'md',
  className = '',
}: Props) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-surface-inset ${size === 'sm' ? 'h-1.5' : 'h-3'} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${TONE_CLASSES[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
