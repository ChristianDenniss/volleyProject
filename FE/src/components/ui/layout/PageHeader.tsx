/**
 * PageHeader — the title block at the top of a page: an optional icon, the fluid page title, an optional count badge and subtitle, and a right-aligned actions slot.
 * Props: `title`, `subtitle?`, `icon?`, `count?`, `actions?`, `align?` (`start` default, `center` for marketing/landing sections).
 * Lives in `components/ui/layout/`; use it instead of a page-specific `<h1 className="xyz-title">` so every page's heading has the same scale and spacing.
 */
import type { ReactNode } from 'react'
import CountBadge from '../badges/CountBadge'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  count?: number
  actions?: ReactNode
  align?: 'start' | 'center'
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  count,
  actions,
  align = 'start',
  className = '',
}: Props) {
  const centered = align === 'center'

  return (
    <header className={`flex flex-wrap items-end justify-between gap-4 ${centered ? 'flex-col items-center text-center' : ''} ${className}`}>
      <div className={`min-w-0 flex flex-col gap-1 ${centered ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3">
          {icon && <span className="shrink-0 text-accent text-2xl leading-none">{icon}</span>}
          <h1 className="m-0 min-w-0 text-page-title font-semibold leading-tight text-content">
            {title}
          </h1>
          {count !== undefined && <CountBadge count={count} />}
        </div>
        {subtitle && (
          <p className="m-0 max-w-[70ch] text-sm text-content-tertiary">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
