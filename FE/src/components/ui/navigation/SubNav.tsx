/**
 * SubNav — the inline "· separated" link row that sits above a page's controls and moves between sibling views (League teams · Team registrations · Register a team).
 * Takes `items: { label, to }[]` and an `activeLabel`; the active entry renders as emphasised text rather than a link, so the current view isn't a link to itself.
 * Lives in `components/ui/navigation/`; use it for a small sibling set — reach for `Tabs` instead when the views swap content in place rather than navigating.
 */
import { Link } from 'react-router-dom'

export interface SubNavItem {
  label: string
  to: string
}

interface Props {
  items: SubNavItem[]
  /** Label of the entry representing the current page. */
  activeLabel?: string
  className?: string
}

export default function SubNav({ items, activeLabel, className = '' }: Props) {
  return (
    <nav className={`flex flex-wrap items-center gap-2 text-sm text-content-tertiary ${className}`}>
      {items.map((item, index) => (
        <span key={item.to} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden className="text-content-muted">·</span>}
          {item.label === activeLabel ? (
            <span aria-current="page" className="font-semibold text-content">
              {item.label}
            </span>
          ) : (
            <Link to={item.to} className="text-accent no-underline transition-colors hover:underline">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
