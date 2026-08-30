/**
 * ResourcePill — a clickable chip identifying a domain entity (player, team, season, game, article, award) that navigates to that entity's page.
 * One `RESOURCE_CONFIG` map owns both the color and the URL shape per entity type, so a player chip is the same green and points at the same route everywhere in the app.
 * Lives in `components/ui/pills/`; always use this instead of an inline colored `<Link>` or an underlined text link for an entity reference.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ResourceType =
  | 'player'
  | 'team'
  | 'season'
  | 'game'
  | 'article'
  | 'award'
  | 'user'

type ResourceSize = 'sm' | 'md'

interface Config {
  className: string
  href: (id: string | number) => string
}

/** Color + route per entity type. Changing where teams live is one edit here, not a
 *  find-and-replace across every table that links to one. */
const RESOURCE_CONFIG: Record<ResourceType, Config> = {
  player:  { className: 'bg-status-success/15 text-status-success border-status-success/30 hover:bg-status-success/25', href: (id) => `/players/${id}` },
  team:    { className: 'bg-status-info/15 text-status-info border-status-info/30 hover:bg-status-info/25', href: (id) => `/teams/${id}` },
  season:  { className: 'bg-status-orange/15 text-status-orange border-status-orange/30 hover:bg-status-orange/25', href: (id) => `/seasons/${id}` },
  game:    { className: 'bg-status-pink/15 text-status-pink border-status-pink/30 hover:bg-status-pink/25', href: (id) => `/games/${id}` },
  article: { className: 'bg-status-purple/15 text-status-purple border-status-purple/30 hover:bg-status-purple/25', href: (id) => `/articles/${id}` },
  award:   { className: 'bg-status-gold/20 text-status-gold border-status-gold/40 hover:bg-status-gold/30', href: (id) => `/awards/${id}` },
  user:    { className: 'bg-brand-subtle text-accent border-brand-muted hover:bg-brand-muted', href: (id) => `/profile/${id}` },
}

const SIZE_CLASSES: Record<ResourceSize, string> = {
  sm: 'text-[0.6875rem] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

interface Props {
  type: ResourceType
  id: string | number
  label: string
  size?: ResourceSize
  icon?: ReactNode
  className?: string
}

export default function ResourcePill({ type, id, label, size = 'sm', icon, className = '' }: Props) {
  const config = RESOURCE_CONFIG[type]
  return (
    <Link
      to={config.href(id)}
      title={label}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border font-medium no-underline transition-colors ${SIZE_CLASSES[size]} ${config.className} ${className}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  )
}
