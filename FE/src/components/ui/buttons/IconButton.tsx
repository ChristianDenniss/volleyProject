/**
 * IconButton — an icon-only button for table-row actions, toolbars and card corners, where a text label would not fit.
 * Props: `icon`, `label` (required — becomes the tooltip and the screen-reader name), `variant` (`default` | `danger` | `accent`), `size` (`sm` | `md`), and `active` for a persistent filled state on a toggled-on control.
 * Lives in `components/ui/buttons/`; prefer this over a bare `<button>` wrapping an icon so every icon action gets the same hit area and accessible name.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonVariant = 'default' | 'danger' | 'accent'
type IconButtonSize = 'sm' | 'md'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: ReactNode
  /** Tooltip text and accessible name. Required — an icon alone is not a label. */
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Persistent tinted background instead of hover-only, for a toggled-on state. */
  active?: boolean
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  default: 'text-content-tertiary hover:text-content hover:bg-surface-inset',
  danger:  'text-content-tertiary hover:text-status-danger hover:bg-status-danger/10',
  accent:  'text-content-tertiary hover:text-accent hover:bg-brand-subtle',
}

const ACTIVE_CLASSES: Record<IconButtonVariant, string> = {
  default: 'text-content bg-surface-inset',
  danger:  'text-status-danger bg-status-danger/10',
  accent:  'text-accent bg-brand-subtle',
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'h-7 w-7 text-sm',
  md: 'h-9 w-9 text-base',
}

export default function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  active = false,
  className = '',
  ...props
}: Props) {
  return (
    <button
      type="button"
      {...props}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`inline-flex items-center justify-center rounded-control transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${SIZE_CLASSES[size]} ${active ? ACTIVE_CLASSES[variant] : VARIANT_CLASSES[variant]} ${className}`}
    >
      {icon}
    </button>
  )
}
