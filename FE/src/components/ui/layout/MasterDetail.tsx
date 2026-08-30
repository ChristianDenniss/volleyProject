/**
 * MasterDetail — the two-pane selector/detail layout: a dense selectable list on the left, a detail pane filling the rest, inside one bordered surface.
 * Use it when picking one item from a list should show that item's contents *beside* the list rather than expanding it in place — a roster editor, a settings page with categories, a label manager. Below the `md` breakpoint the two panes stack, and the list caps its height so the detail pane stays reachable.
 * Lives in `components/ui/layout/`; exports `MasterDetailList`, `MasterDetailItem`, `MasterDetailPane`, `MasterDetailHeader` and `MasterDetailBody` alongside the container. For a list where the detail belongs inline, use `DataTable`'s `expandedRow` instead.
 */
import type { ReactNode } from 'react'
import SearchBar from '@/components/ui/filters/SearchBar'
import EmptyState from '@/components/ui/feedback/EmptyState'

interface MasterDetailProps {
  children: ReactNode
  /** Full-width chrome above both panes — a search box, category tabs. */
  header?: ReactNode
  className?: string
}

/**
 * The container. Expects exactly two children: a `MasterDetailList` and a
 * `MasterDetailPane`.
 */
export default function MasterDetail({ children, header, className = '' }: MasterDetailProps) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border border-border bg-surface ${className}`}
    >
      {header && <div className="shrink-0 border-b border-border">{header}</div>}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr]">
        {children}
      </div>
    </div>
  )
}

interface MasterDetailListProps {
  title: string
  /** Controls beside the list title, e.g. a filter toggle. */
  actions?: ReactNode
  /** Adds a search box under the title. Wired to the shared SearchBar. */
  search?: {
    value: string
    onSearch: (value: string) => void
    placeholder?: string
  }
  loading?: boolean
  empty?: boolean
  emptyLabel?: string
  /** Rendered above the items, inside the scroll area — e.g. an inline create row. */
  leading?: ReactNode
  /** Pinned under the scrolling list — e.g. an "Add" button. */
  footer?: ReactNode
  children: ReactNode
}

/** The left pane: a titled, optionally searchable list of `MasterDetailItem`s. */
export function MasterDetailList({
  title,
  actions,
  search,
  loading = false,
  empty = false,
  emptyLabel = 'Nothing here yet.',
  leading,
  footer,
  children,
}: MasterDetailListProps) {
  return (
    <div className="flex min-h-0 flex-col border-b border-border max-md:max-h-60 md:border-b-0 md:border-r">
      <div className="flex shrink-0 flex-col gap-2 border-b border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-content-muted">
            {title}
          </h3>
          {actions}
        </div>
        {search && (
          <SearchBar
            value={search.value}
            onSearch={search.onSearch}
            placeholder={search.placeholder}
            className="w-full"
          />
        )}
      </div>

      <div role="listbox" aria-label={title} className="min-h-0 flex-1 overflow-y-auto">
        {leading}
        {loading ? (
          <div className="px-5 py-3 text-xs text-content-muted">Loading…</div>
        ) : empty ? (
          <div className="px-5 py-6">
            <EmptyState label={emptyLabel} compact />
          </div>
        ) : (
          <div className="divide-y divide-border">{children}</div>
        )}
      </div>

      {footer && <div className="shrink-0 border-t border-border">{footer}</div>}
    </div>
  )
}

interface MasterDetailItemProps {
  label: string
  onClick: () => void
  selected?: boolean
  /** Trailing count, e.g. how many members a category has. */
  count?: number | string
  title?: string
}

/** One selectable row in the list. Renders as a `role="option"` button. */
export function MasterDetailItem({
  label,
  onClick,
  selected = false,
  count,
  title,
}: MasterDetailItemProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      title={title}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2 px-5 py-2 text-left text-sm transition-colors ${
        selected ? 'bg-accent/10 text-content' : 'text-content hover:bg-surface-inset'
      }`}
    >
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {count != null && (
        <span
          className={`shrink-0 text-xs tabular-nums ${selected ? 'text-accent' : 'text-content-muted'}`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

interface MasterDetailPaneProps {
  /** True when nothing is selected — shows `emptyLabel` centred instead of children. */
  empty?: boolean
  emptyLabel?: string
  children?: ReactNode
}

/** The right pane. Compose `MasterDetailHeader` + `MasterDetailBody` inside it. */
export function MasterDetailPane({
  empty = false,
  emptyLabel = 'Select an item to see its details.',
  children,
}: MasterDetailPaneProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      {empty ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState label={emptyLabel} compact />
        </div>
      ) : (
        children
      )}
    </div>
  )
}

interface MasterDetailHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

/** The detail pane's own header row — the selected item's name and its actions. */
export function MasterDetailHeader({ title, subtitle, actions }: MasterDetailHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-3 pl-5 pr-8">
      <div className="min-w-0 flex-1">
        {typeof title === 'string' ? (
          <h3 className="m-0 truncate text-sm font-semibold text-content">{title}</h3>
        ) : (
          title
        )}
        {subtitle != null && subtitle !== '' && (
          <div className="mt-0.5 text-xs text-content-muted">{subtitle}</div>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  )
}

interface MasterDetailBodyProps {
  children: ReactNode
  className?: string
}

/** The detail pane's scrolling content area. */
export function MasterDetailBody({ children, className = '' }: MasterDetailBodyProps) {
  return <div className={`min-h-0 flex-1 overflow-y-auto p-5 ${className}`}>{children}</div>
}
