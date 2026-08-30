/**
 * StatCard — a single labelled figure ("Kills 412", "Win rate 68%") with an optional icon, delta and footnote, for dashboard and profile stat rows.
 * `tone` tints the value (neutral by default; `success`/`danger` for a good/bad delta, `accent` for the headline figure), and `size` scales it from a dense grid cell up to a hero number.
 * Lives in `components/ui/layout/`; use `DetailStats` below it when the figures are a definition list rather than a row of cards.
 */
import type { ReactNode } from 'react'

type StatTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning'
type StatSize = 'sm' | 'md' | 'lg'

interface Props {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  /** Small qualifier under the value — "vs last season", "across 12 games". */
  footnote?: ReactNode
  tone?: StatTone
  size?: StatSize
  className?: string
}

const TONE_CLASSES: Record<StatTone, string> = {
  neutral: 'text-content',
  accent:  'text-accent',
  success: 'text-status-success',
  danger:  'text-status-danger',
  warning: 'text-status-warning',
}

const SIZE_CLASSES: Record<StatSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
}

export default function StatCard({
  label,
  value,
  icon,
  footnote,
  tone = 'neutral',
  size = 'md',
  className = '',
}: Props) {
  return (
    <div className={`flex flex-col gap-1 rounded-card border border-border bg-surface p-4 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-content-tertiary">
        {icon && <span className="text-sm text-content-muted">{icon}</span>}
        {label}
      </div>
      <div className={`font-semibold tabular-nums leading-tight ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]}`}>
        {value}
      </div>
      {footnote && <div className="text-xs text-content-muted">{footnote}</div>}
    </div>
  )
}
