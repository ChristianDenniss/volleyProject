/**
 * CountBadge — a small rounded count pill that sits next to a page or section heading ("Players 128", "Pending 4").
 * Props: `count`, `size` (`sm` | `md`), and `color` (`neutral` default, or a status color) — the color carries meaning, so a zero-value badge should stay neutral.
 * Lives in `components/ui/badges/`; use it instead of putting a raw number in parentheses after a heading.
 */
type CountBadgeSize = 'sm' | 'md'
type CountBadgeColor = 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'accent'

interface Props {
  count: number
  size?: CountBadgeSize
  color?: CountBadgeColor
  className?: string
}

const COLOR_CLASSES: Record<CountBadgeColor, string> = {
  neutral: 'bg-surface-inset text-content-tertiary border-border',
  success: 'bg-status-success/15 text-status-success border-status-success/30',
  info:    'bg-status-info/15 text-status-info border-status-info/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  danger:  'bg-status-danger/15 text-status-danger border-status-danger/30',
  accent:  'bg-brand-subtle text-accent border-brand-muted',
}

const SIZE_CLASSES: Record<CountBadgeSize, string> = {
  sm: 'min-w-5 h-5 px-1.5 text-[0.6875rem]',
  md: 'min-w-6 h-6 px-2 text-xs',
}

export default function CountBadge({ count, size = 'md', color = 'neutral', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-semibold tabular-nums ${SIZE_CLASSES[size]} ${COLOR_CLASSES[color]} ${className}`}
    >
      {count}
    </span>
  )
}
