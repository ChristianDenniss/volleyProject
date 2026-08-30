/**
 * LinkButton — a react-router `<Link>` (or an `<a>` for external `href`s) wearing Button's exact styling.
 * Takes the same `variant` / `size` / `fullWidth` props as Button and reuses its class maps, so a navigation action and a click action are visually identical without duplicating the variant table.
 * Lives in `components/ui/buttons/`; use it instead of styling a `<Link>` by hand or wrapping one in a Button.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SIZE_CLASSES, VARIANT_CLASSES, type ButtonSize, type ButtonVariant } from './Button'

interface Props {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  /** Renders an `<a target="_blank">` instead of a router `<Link>` — for off-site destinations. */
  external?: boolean
  /** Router location state passed through to the destination (e.g. a pre-selected filter). */
  state?: unknown
  title?: string
  className?: string
  children: ReactNode
}

const BASE = 'inline-flex items-center justify-center gap-2 whitespace-nowrap no-underline transition-colors cursor-pointer'

export default function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  external = false,
  state,
  title,
  className = '',
  children,
}: Props) {
  const classes = `${BASE} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''} ${className}`

  if (external) {
    return (
      <a href={to} title={title} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    )
  }

  return (
    <Link to={to} state={state} title={title} className={classes}>
      {children}
    </Link>
  )
}
