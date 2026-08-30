/**
 * Button — the base clickable-action button for every interactive control, rendering a styled `<button>` with an icon+label slot.
 * Supports `variant` (primary, secondary, ghost, outline, danger, danger-filled, success, warning, accent, link) and `size` (xs, sm, md, lg, icon), plus `fullWidth` and `loading`; forwards all native button attributes.
 * Lives in `components/ui/buttons/`; the foundation for every clickable action in the app and wrapped by higher-level buttons like IconButton and LinkButton.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'danger-filled'
  | 'success'
  | 'warning'
  | 'accent'
  | 'link'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the width of the parent — for stacked form actions and mobile CTAs. */
  fullWidth?: boolean
  /** Disables the button and swaps the label for a spinner + `loadingLabel`. */
  loading?: boolean
  loadingLabel?: string
  children: ReactNode
}

export const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-brand text-on-brand font-semibold hover:bg-brand-hover disabled:opacity-40',
  secondary: 'bg-surface-inset border border-border text-content-secondary font-medium hover:bg-surface-raised hover:border-border-strong disabled:opacity-40',
  ghost:     'text-content-secondary font-medium hover:text-content hover:bg-surface-inset disabled:opacity-40',
  /** A bordered ghost — outline instead of no border, and fainter text than `ghost`/`secondary`.
   *  For a dismissive action (Cancel) that should read as quieter than its paired primary action. */
  outline:   'bg-transparent border border-border text-content-muted font-medium hover:bg-surface-inset hover:text-content-secondary disabled:opacity-40',
  danger:          'border border-status-danger/50 text-status-danger font-medium hover:bg-status-danger/10 disabled:opacity-40',
  'danger-filled': 'bg-status-danger text-on-brand font-semibold hover:opacity-90 disabled:opacity-40',
  success:   'bg-status-success/10 text-status-success border border-status-success/30 font-medium hover:bg-status-success/20 disabled:opacity-40',
  warning:   'bg-status-warning/10 text-status-warning border border-status-warning/30 font-medium hover:bg-status-warning/20 disabled:opacity-40',
  accent:    'bg-brand-subtle text-accent border border-brand-muted font-medium hover:bg-brand-muted disabled:opacity-40',
  /** Renders as inline text, not a control — for "see all" / "cancel" affordances inside prose. */
  link:      'bg-transparent text-accent font-medium underline-offset-2 hover:underline disabled:opacity-40 !h-auto !px-0',
}

export const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs:   'h-6 px-2.5 text-xs rounded-control',
  sm:   'h-8 px-3 text-sm rounded-control',
  md:   'h-9 px-4 text-sm rounded-card',
  lg:   'h-11 px-6 text-base rounded-card',
  icon: 'h-8 w-8 p-0 rounded-full',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingLabel,
  className = '',
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && <Spinner />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  )
}

/** Inline spinner sized to sit on the button's text baseline. Local to Button — the
 *  page-level spinner is `components/ui/feedback/LoadingSpinner`. */
function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}
