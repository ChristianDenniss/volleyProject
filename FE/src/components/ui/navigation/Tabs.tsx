/**
 * Tabs — an underline-style tab strip driven by an `items` array and the active key, plus `TabButton` for the rare case where the triggers can't be described declaratively.
 * Each item carries a `key`, a `label`, an optional `count` badge and an optional `icon`; `variant` switches between the underline strip and a segmented pill group.
 * Lives in `components/ui/navigation/`; use it instead of a row of buttons with an `active` class, which is how every tabbed view in the app used to be built.
 */
import type { ReactNode } from 'react'
import CountBadge from '../badges/CountBadge'

export interface TabItem {
  key: string
  label: ReactNode
  count?: number
  icon?: ReactNode
  disabled?: boolean
}

type TabsVariant = 'underline' | 'segmented'

interface Props {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
  variant?: TabsVariant
  className?: string
}

const CONTAINER_CLASSES: Record<TabsVariant, string> = {
  underline: 'flex flex-wrap items-center gap-1 border-b border-border',
  segmented: 'inline-flex flex-wrap items-center gap-1 rounded-card border border-border bg-surface-inset p-1',
}

const TAB_CLASSES: Record<TabsVariant, { base: string; active: string; inactive: string }> = {
  underline: {
    base: '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
    active: 'border-accent text-accent',
    inactive: 'border-transparent text-content-tertiary hover:text-content hover:border-border-strong',
  },
  segmented: {
    base: 'rounded-control px-3 py-1.5 text-sm font-medium transition-colors',
    active: 'bg-surface text-content shadow-[var(--shadow-xs)]',
    inactive: 'text-content-tertiary hover:text-content',
  },
}

export default function Tabs({ items, activeKey, onChange, variant = 'underline', className = '' }: Props) {
  return (
    <div role="tablist" className={`${CONTAINER_CLASSES[variant]} ${className}`}>
      {items.map((item) => (
        <TabButton
          key={item.key}
          active={item.key === activeKey}
          disabled={item.disabled}
          variant={variant}
          count={item.count}
          icon={item.icon}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </TabButton>
      ))}
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  variant?: TabsVariant
  count?: number
  icon?: ReactNode
  disabled?: boolean
  className?: string
}

export function TabButton({
  active,
  onClick,
  children,
  variant = 'underline',
  count,
  icon,
  disabled = false,
  className = '',
}: TabButtonProps) {
  const styles = TAB_CLASSES[variant]

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${styles.base} ${active ? styles.active : styles.inactive} ${className}`}
    >
      {icon}
      {children}
      {count !== undefined && (
        <CountBadge count={count} size="sm" color={active ? 'accent' : 'neutral'} />
      )}
    </button>
  )
}
