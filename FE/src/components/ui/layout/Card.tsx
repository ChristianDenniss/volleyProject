/**
 * Card — the standard bordered surface panel that holds a group of related content (a stat block, a form section, a team tile).
 * Props: `tone` (`surface` default, `inset` for a recessed block, `inverse` for the deliberately-dark panels, `accent` for a brand-tinted callout), `padding`, `interactive` for a hoverable/clickable tile, and an optional `header`/`footer` slot.
 * Lives in `components/ui/layout/`; use it instead of a page-specific `.xyz-card` class so every panel shares one border, radius and elevation.
 */
import type { ReactNode } from 'react'

type CardTone = 'surface' | 'raised' | 'inset' | 'inverse' | 'accent'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface Props {
  children: ReactNode
  tone?: CardTone
  padding?: CardPadding
  /** Adds hover elevation + pointer cursor. Pair with `onClick` or wrap the card in a Link. */
  interactive?: boolean
  header?: ReactNode
  footer?: ReactNode
  onClick?: () => void
  className?: string
}

const TONE_CLASSES: Record<CardTone, string> = {
  surface: 'bg-surface border-border text-content',
  raised:  'bg-surface-raised border-border text-content',
  inset:   'bg-surface-inset border-border text-content',
  /** Deliberately dark in a light app (player hero, season card) — not a theme state. */
  inverse: 'bg-surface-inverse border-surface-inverse-raised text-content-inverse',
  accent:  'bg-brand-subtle border-brand-muted text-content',
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
}

export default function Card({
  children,
  tone = 'surface',
  padding = 'md',
  interactive = false,
  header,
  footer,
  onClick,
  className = '',
}: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-card border overflow-hidden ${TONE_CLASSES[tone]} ${interactive ? 'cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)]' : ''} ${className}`}
    >
      {header && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          {header}
        </div>
      )}
      <div className={PADDING_CLASSES[padding]}>{children}</div>
      {footer && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  )
}
