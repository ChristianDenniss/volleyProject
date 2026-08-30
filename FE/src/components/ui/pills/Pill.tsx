/**
 * Pill — the basic rounded tag chip used on cards, tables and detail pages, with an optional leading icon.
 * Color comes from the `tone` prop (`neutral` default, plus accent/success/warning/danger/info/purple/gold); `bare` gives a borderless tighter style, and passing `onClick` renders it as an interactive `<button>`.
 * Lives in `components/ui/pills/`; the go-to chip for plain tag lists — use `ResourcePill` instead when the chip identifies a player, team, season or game.
 */
import type { ReactNode } from 'react'

export type PillTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'gold'

type PillSize = 'sm' | 'md'

interface Props {
  children: ReactNode
  tone?: PillTone
  size?: PillSize
  /** Borderless, tighter-padded style for dense tag lists inside cards. */
  bare?: boolean
  icon?: ReactNode
  onClick?: () => void
  title?: string
  disabled?: boolean
  className?: string
}

const TONE_CLASSES: Record<PillTone, string> = {
  neutral: 'bg-surface-inset text-content-tertiary border-border',
  accent:  'bg-brand-subtle text-accent border-brand-muted',
  success: 'bg-status-success/15 text-status-success border-status-success/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  danger:  'bg-status-danger/15 text-status-danger border-status-danger/30',
  info:    'bg-status-info/15 text-status-info border-status-info/30',
  purple:  'bg-status-purple/15 text-status-purple border-status-purple/30',
  gold:    'bg-status-gold/20 text-status-gold border-status-gold/40',
}

const SIZE_CLASSES: Record<PillSize, string> = {
  sm: 'text-[0.6875rem] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export default function Pill({
  children,
  tone = 'neutral',
  size = 'md',
  bare = false,
  icon,
  onClick,
  title,
  disabled = false,
  className = '',
}: Props) {
  const Tag = onClick ? 'button' : 'span'
  const interactive = onClick
    ? disabled
      ? 'cursor-not-allowed opacity-40'
      : 'cursor-pointer hover:opacity-75 transition-opacity'
    : ''

  return (
    <Tag
      onClick={disabled ? undefined : onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${SIZE_CLASSES[size]} ${bare ? '' : 'border'} ${TONE_CLASSES[tone]} ${interactive} ${className}`}
    >
      {icon}
      {children}
    </Tag>
  )
}
