/**
 * Breadcrumb — the parent trail above a detail page's title, where every crumb but the last is a link and the last is plain text marked as the current page.
 * Takes `items: { label, to? }[]`; a crumb without `to` renders as text, so a non-navigable grouping level ("Portal") doesn't become a dead link.
 * Lives in `components/ui/navigation/`; render it directly above `layout/PageHeader` on every detail route.
 */
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="m-0 flex flex-wrap items-center gap-1.5 p-0 text-xs text-content-tertiary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.to && !isLast ? (
                <Link to={item.to} className="text-content-tertiary no-underline transition-colors hover:text-accent">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'font-medium text-content-secondary' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden className="text-content-muted">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
