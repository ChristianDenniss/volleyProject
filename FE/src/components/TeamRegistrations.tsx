/**
 * TeamRegistrations — the public list of team applications for the current registration window, tabbed by region, with a row that expands into a quick preview before opening full details.
 * The header reports capacity as "accepted / capacity" plus a spots-left line when the season declares one, so a visitor can see at a glance whether registration is still worth starting.
 * Lives in `components/`; routed at /teams/registrations.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegion } from '@/context/regionContext'
import { useAuth } from '@/context/authContext'
import { useTeamRegistrations, useRegistrationSummary } from '@/hooks/useTeamRegistrations'
import type { RegionCode, TeamRegistration } from '@/types/interfaces'
import { TEAMS_NAV_ITEMS } from '@/constants/teamsNav'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import DetailStats from '@/components/ui/layout/DetailStats'
import SubNav from '@/components/ui/navigation/SubNav'
import Tabs from '@/components/ui/navigation/Tabs'
import LinkButton from '@/components/ui/buttons/LinkButton'
import { RegStatusBadge, REGISTRATION_STATUSES } from '@/components/ui/badges/RegStatusBadge'

const REGION_TABS: { key: RegionCode; label: string }[] = [
  { key: 'na', label: 'NA' },
  { key: 'eu', label: 'EU' },
  { key: 'as', label: 'AS' },
]

export default function TeamRegistrations() {
  const { regions, setActiveRegion, activeRegion } = useRegion()
  const { isAuthenticated } = useAuth()

  const activeCode = (activeRegion?.code || 'na') as RegionCode
  const { data, loading, error } = useTeamRegistrations({ region: activeCode })
  const summary = useRegistrationSummary(activeCode)

  const [selected, setSelected] = useState<TeamRegistration | null>(null)

  const capacityLine = useMemo(() => {
    if (!summary) return 'Accepted teams'
    if (summary.capacity != null) return `Accepted teams ${summary.accepted}/${summary.capacity}`
    return `Accepted teams ${summary.accepted}`
  }, [summary])

  const spotsLine =
    summary?.spotsLeft != null
      ? `${summary.spotsLeft} team spot${summary.spotsLeft === 1 ? '' : 's'} left`
      : null

  const registerLabel = isAuthenticated ? 'Register a team' : 'Log in to register'

  const columns: DataTableColumn<TeamRegistration>[] = [
    {
      key: 'teamName',
      header: 'Team',
      render: (row) => <span className="font-medium text-content">{row.teamName}</span>,
    },
    { key: 'captainDiscord', header: 'Captain Discord' },
    { key: 'captainRoblox', header: 'Captain Roblox', hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => <RegStatusBadge status={row.status} />,
    },
  ]

  return (
    <PageContainer width="wide">
      <SubNav items={TEAMS_NAV_ITEMS} activeLabel="Team registrations" />

      <PageHeader
        title="Team registrations"
        subtitle="Public applications for the current registration window. Select a row for a quick preview, or open full details."
        actions={
          <div className="flex flex-col items-end gap-3">
            <LinkButton to="/teams/register">{registerLabel}</LinkButton>
            <div className="flex flex-wrap gap-1.5" aria-label="Status legend">
              {REGISTRATION_STATUSES.map((status) => (
                <RegStatusBadge key={status} status={status} />
              ))}
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-0.5">
        <p className="m-0 text-sm font-medium text-content-secondary">{capacityLine}</p>
        {spotsLine && <p className="m-0 text-xs text-content-muted">{spotsLine}</p>}
      </div>

      <Tabs
        variant="segmented"
        items={REGION_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
        activeKey={activeCode}
        onChange={(key) => {
          setSelected(null)
          const match = regions.find((region) => region.code === key)
          if (match) setActiveRegion(match)
        }}
      />

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyLabel="No registrations yet for this region."
        onRowClick={(row) => setSelected(selected?.id === row.id ? null : row)}
        rowTone={(row) => (selected?.id === row.id ? 'accent' : 'default')}
        expandedRow={(row) =>
          selected?.id === row.id ? (
            <div className="flex flex-col gap-4">
              <DetailStats
                columns={3}
                items={[
                  { label: 'Status', value: <RegStatusBadge status={row.status} /> },
                  { label: 'Captain', value: `${row.captainDiscord} / ${row.captainRoblox}` },
                  ...(row.hexColor
                    ? [
                        {
                          label: 'Colors',
                          value: (
                            <span className="inline-flex items-center gap-2">
                              {/* The swatch IS the registered team color — a runtime value
                                  with no token equivalent, so it stays an inline style. */}
                              <span
                                aria-hidden
                                className="inline-block h-4 w-4 shrink-0 rounded-full border border-border"
                                style={{ background: row.hexColor }}
                              />
                              {row.hexColor}
                              {row.brickColor ? ` · ${row.brickColor}` : ''}
                            </span>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
              <Link
                to={`/teams/registrations/${row.id}`}
                onClick={(event) => event.stopPropagation()}
                className="self-start text-sm font-medium text-accent no-underline hover:underline"
              >
                View full details →
              </Link>
            </div>
          ) : null
        }
      />
    </PageContainer>
  )
}
