/**
 * Dashboard — the admin portal's landing page: a grid of collection counts and a row of shortcuts into each management section.
 * Tiles and shortcuts are both declared as module-scope arrays keyed off `usePortalDashboard`'s counts, so adding a metric or a section is one entry rather than another copy of the markup.
 * Lives in `components/portal/`; it is the portal's index route.
 */
import type { ReactNode } from 'react'
import {
  FaVolleyballBall,
  FaUserAlt,
  FaChartBar,
  FaNewspaper,
  FaUsers,
  FaCalendarAlt,
  FaTrophy,
  FaClock,
} from 'react-icons/fa'
import LuvLateAvatar from '@/images/LuvLate.png'
import { usePortalDashboard, type PortalDashboardCounts } from '@/hooks/usePortalDashboard'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import StatCard from '@/components/ui/layout/StatCard'
import LinkButton from '@/components/ui/buttons/LinkButton'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import { SkeletonCardGrid } from '@/components/ui/feedback/Skeleton'

interface StatTile {
  key: keyof PortalDashboardCounts
  label: string
  icon: ReactNode
}

const STAT_TILES: StatTile[] = [
  { key: 'teams', label: 'Total Teams', icon: <FaVolleyballBall /> },
  { key: 'users', label: 'Total Users', icon: <FaUserAlt /> },
  { key: 'stats', label: 'Total Stat Entries', icon: <FaChartBar /> },
  { key: 'articles', label: 'Total Articles', icon: <FaNewspaper /> },
  { key: 'players', label: 'Total Players', icon: <FaUsers /> },
  { key: 'seasons', label: 'Total Seasons', icon: <FaCalendarAlt /> },
  { key: 'awards', label: 'Total Awards', icon: <FaTrophy /> },
  { key: 'games', label: 'Total Games', icon: <FaVolleyballBall /> },
  { key: 'scheduledGames', label: 'Scheduled Games', icon: <FaClock /> },
  { key: 'completedGames', label: 'Completed Games', icon: <FaTrophy /> },
]

const QUICK_ACTIONS = [
  { label: 'Manage Teams', to: '/portal/teams' },
  { label: 'Manage Articles', to: '/portal/articles' },
  { label: 'Manage Seasons', to: '/portal/seasons' },
  { label: 'Manage Games', to: '/portal/games' },
  { label: 'Manage Stats', to: '/portal/stats' },
  { label: 'Manage Players', to: '/portal/players' },
  { label: 'Manage Users', to: '/portal/users' },
  { label: 'Manage Awards', to: '/portal/awards' },
  { label: 'Manage Applications', to: '/portal/applications' },
]

export default function Dashboard() {
  const { counts, loading, error } = usePortalDashboard()

  return (
    <PageContainer>
      <PageHeader title="Dashboard" subtitle="League totals at a glance." />

      {error && <ErrorNotice message={error} />}

      {loading ? (
        <SkeletonCardGrid count={STAT_TILES.length} height="h-24" />
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {STAT_TILES.map((tile) => (
            <StatCard
              key={tile.label}
              label={tile.label}
              value={counts[tile.key]}
              icon={tile.icon}
            />
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeader title="Quick Actions" />
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <LinkButton key={action.to} to={action.to} variant="secondary" size="sm">
              {action.label}
            </LinkButton>
          ))}
        </div>
      </section>

      <figure className="m-0 flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface-inset p-4">
        <img
          src={LuvLateAvatar}
          alt=""
          className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
        />
        <blockquote className="m-0 min-w-0 flex-1 text-sm italic text-content-secondary">
          &ldquo;Every great season starts with the people behind the scenes.&rdquo;
        </blockquote>
      </figure>
    </PageContainer>
  )
}
