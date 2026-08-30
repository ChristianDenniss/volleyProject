/**
 * PortalLayout — the admin portal shell: a collapsible left sidebar listing every management section, and the routed page rendered beside it.
 * Sections come from the module-scope `PORTAL_SECTIONS` array, so adding a management page is one entry; the collapse toggle shrinks the sidebar to a rail rather than removing it, keeping the toggle reachable.
 * Nested Suspense around `<Outlet />` keeps the sidebar mounted while a lazy page chunk loads; nav links prefetch those chunks on hover/focus.
 * Lives in `components/portal/`; App mounts it behind `PrivateRoute` for admin and superadmin only.
 */
import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import IconButton from '@/components/ui/buttons/IconButton'
import { PageLoader } from '@/components/ui/feedback/LoadingSpinner'

interface PortalSection {
  label: string
  /** Route segment relative to /portal. Empty string is the index route. */
  to: string
  /** Index route needs `end` so it isn't marked active on every child path. */
  end?: boolean
}

const PORTAL_SECTIONS: PortalSection[] = [
  { label: 'Dashboard', to: '', end: true },
  { label: 'Users', to: 'users' },
  { label: 'Seasons', to: 'seasons' },
  { label: 'Teams', to: 'teams' },
  { label: 'Players', to: 'players' },
  { label: 'Games', to: 'games' },
  { label: 'Stats', to: 'stats' },
  { label: 'Articles', to: 'articles' },
  { label: 'Registrations', to: 'registrations' },
  { label: 'Applications', to: 'applications' },
  { label: 'Awards', to: 'awards' },
]

/** Prefetch portal page chunks on hover/focus so nav feels instant. */
const PORTAL_PREFETCH: Record<string, () => Promise<unknown>> = {
  '': () => import('./Dashboard'),
  users: () => import('./UsersPage'),
  seasons: () => import('./SeasonsPage'),
  teams: () => import('./TeamsPage'),
  players: () => import('./PlayersPage'),
  games: () => import('./GamesPage'),
  stats: () => import('./StatsPage'),
  articles: () => import('./ArticlesPage'),
  registrations: () => import('./RegistrationsHubPage'),
  applications: () => import('./ApplicationsPage'),
  awards: () => import('./AwardsPage'),
}

const LINK_BASE =
  'block rounded-control px-3 py-2 text-sm no-underline transition-colors'
const LINK_ACTIVE = 'bg-brand text-on-brand font-semibold'
const LINK_INACTIVE = 'text-content-secondary hover:bg-surface-inset hover:text-content'

export default function PortalLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-0 flex-1 items-stretch">
      <aside
        className={`relative shrink-0 border-r border-border bg-surface transition-all duration-200 ${collapsed ? 'w-10' : 'w-56'}`}
      >
        <div className={`flex flex-col gap-4 p-4 ${collapsed ? 'hidden' : ''}`}>
          <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-content-tertiary">
            Admin Portal
          </h2>
          <nav>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {PORTAL_SECTIONS.map((section) => (
                <li key={section.label}>
                  <NavLink
                    to={section.to}
                    end={section.end}
                    className={({ isActive }) =>
                      `${LINK_BASE} ${isActive ? LINK_ACTIVE : LINK_INACTIVE}`
                    }
                    onMouseEnter={() => { void PORTAL_PREFETCH[section.to]?.() }}
                    onFocus={() => { void PORTAL_PREFETCH[section.to]?.() }}
                  >
                    {section.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <IconButton
          icon={collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          label={collapsed ? 'Show admin sidebar' : 'Hide admin sidebar'}
          size="sm"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          className="absolute -right-3 top-4 z-10 border border-border bg-surface shadow-[var(--shadow-xs)]"
        />
      </aside>

      <main className="min-w-0 flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
