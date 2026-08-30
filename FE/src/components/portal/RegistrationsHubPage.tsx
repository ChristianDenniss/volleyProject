/**
 * RegistrationsHubPage — the portal's moderation view for team applications, tabbed by region, where a row expands to show colors, vice captain and roster before accepting, denying or revoking it.
 * Accepting can return a conflict (duplicate team name, or a player already rostered elsewhere); that opens the resolution modal, where the name can be changed and each contested player transferred or excluded.
 * Lives in `components/portal/`; mounted at /portal/registrations. All requests go through `useRegistrationModeration`.
 */
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useTeamRegistrations,
  useRegistrationSummary,
  useRegistrationModeration,
  type PlayerConflictAction,
} from '@/hooks/useTeamRegistrations'
import type { RegionCode, TeamRegistration } from '@/types/interfaces'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import DetailStats from '@/components/ui/layout/DetailStats'
import Tabs from '@/components/ui/navigation/Tabs'
import Button from '@/components/ui/buttons/Button'
import Modal from '@/components/ui/modals/Modal'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'
import Select from '@/components/ui/inputs/Select'
import { RegStatusBadge } from '@/components/ui/badges/RegStatusBadge'

const REGIONS: RegionCode[] = ['na', 'eu', 'as']

const PLAYER_ACTION_OPTIONS = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'exclude', label: 'Exclude' },
]

/** Statuses that still accept an accept/deny decision. */
const ACTIONABLE = ['pending', 'conflict']

export default function RegistrationsHubPage() {
  const [region, setRegion] = useState<RegionCode>('na')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [playerActions, setPlayerActions] = useState<Record<string, PlayerConflictAction>>({})

  const { data, loading, error, reload } = useTeamRegistrations({ region, full: true })
  const summary = useRegistrationSummary(region)

  const onChanged = useCallback(() => reload(), [reload])
  const moderation = useRegistrationModeration(onChanged)

  const capacityLine = !summary
    ? 'Accepted —'
    : summary.capacity != null
      ? `Accepted ${summary.accepted}/${summary.capacity}`
      : `Accepted ${summary.accepted}`

  const columns: DataTableColumn<TeamRegistration>[] = [
    {
      key: 'teamName',
      header: 'Team',
      render: (row) => <span className="font-medium text-content">{row.teamName}</span>,
    },
    {
      key: 'submitter',
      header: 'Submitter',
      hideOnMobile: true,
      render: (row) => row.submittedBy?.username || row.submittedByUserId,
    },
    {
      key: 'captain',
      header: 'Captain',
      render: (row) => `${row.captainDiscord} / ${row.captainRoblox}`,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => <RegStatusBadge status={row.status} />,
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Registrations"
        subtitle={
          <>
            Manage team applications. Other registration types can be added here later.{' '}
            <Link to="/portal/teams" className="text-accent no-underline hover:underline">
              League teams CRUD
            </Link>
          </>
        }
      />

      <p className="m-0 text-sm font-medium text-content-secondary">
        Teams · {region.toUpperCase()} · {capacityLine}
      </p>

      <Tabs
        variant="segmented"
        items={REGIONS.map((code) => ({ key: code, label: code.toUpperCase() }))}
        activeKey={region}
        onChange={(key) => {
          setRegion(key as RegionCode)
          setExpanded(null)
        }}
      />

      {moderation.message && <ErrorNotice message={moderation.message} tone="info" />}
      {moderation.errorMessage && <ErrorNotice message={moderation.errorMessage} />}

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyLabel="No registrations for this region."
        onRowClick={(row) => setExpanded(expanded === row.id ? null : row.id)}
        rowTone={(row) => (expanded === row.id ? 'accent' : 'default')}
        expandedRow={(row) =>
          expanded === row.id ? (
            <div className="flex flex-col gap-4">
              <DetailStats
                columns={2}
                items={[
                  {
                    label: 'Colors',
                    value: (
                      <span className="inline-flex items-center gap-2">
                        {row.hexColor && (
                          /* The registered team color — a runtime value with no token. */
                          <span
                            aria-hidden
                            className="inline-block h-4 w-4 shrink-0 rounded-full border border-border"
                            style={{ background: row.hexColor }}
                          />
                        )}
                        {row.hexColor} · {row.brickColor}
                      </span>
                    ),
                  },
                  { label: 'Vice', value: `${row.viceDiscord} / ${row.viceRoblox}` },
                ]}
              />

              {(row.roster ?? []).length > 0 && (
                <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {(row.roster ?? []).map((player, index) => (
                    <li
                      key={index}
                      className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface px-3 py-2 text-sm"
                    >
                      <span className="shrink-0 rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-semibold text-accent">
                        P{index + 1}
                      </span>
                      <span className="text-content">{player.discord}</span>
                      <span aria-hidden className="text-content-muted">·</span>
                      <span className="text-content-tertiary">{player.roblox}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2">
                {ACTIONABLE.includes(row.status) && (
                  <>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        void moderation.accept(row.id)
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        void moderation.deny(row.id)
                      }}
                    >
                      Deny
                    </Button>
                  </>
                )}
                {row.status === 'accepted' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      void moderation.revoke(row.id)
                    }}
                  >
                    Revoke (while apps open)
                  </Button>
                )}
              </div>
            </div>
          ) : null
        }
      />

      <Modal
        isOpen={Boolean(moderation.conflicts && moderation.conflictId)}
        onClose={moderation.closeConflicts}
        title="Resolve conflicts"
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={moderation.closeConflicts}>
              Close
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void moderation.resolveConflicts('pending')}
            >
              Revert pending
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void moderation.resolveConflicts('denied')}
            >
              Deny
            </Button>
            <Button
              size="sm"
              onClick={() => void moderation.resolveConflicts(undefined, playerActions)}
            >
              Apply &amp; accept
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Team name" hint="Change it here to clear a name clash.">
            {(id) => (
              <TextInput
                id={id}
                value={moderation.conflictTeamName}
                onChange={(e) => moderation.setConflictTeamName(e.target.value)}
              />
            )}
          </FormField>

          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {(moderation.conflicts ?? []).map((conflict, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center gap-2 rounded-card border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-sm text-content-secondary"
              >
                {conflict.type === 'name' && <>Name clash: {conflict.teamName}</>}
                {conflict.type === 'player' && (
                  <>
                    <span>
                      Player {conflict.roblox} on {conflict.existingTeamName}
                    </span>
                    <Select
                      size="sm"
                      aria-label={`Resolution for ${conflict.roblox}`}
                      value={playerActions[conflict.roblox!] || ''}
                      placeholder="Choose…"
                      options={PLAYER_ACTION_OPTIONS}
                      onChange={(e) =>
                        setPlayerActions((prev) => ({
                          ...prev,
                          [conflict.roblox!]: e.target.value as PlayerConflictAction,
                        }))
                      }
                      className="w-auto min-w-[9rem]"
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </PageContainer>
  )
}
