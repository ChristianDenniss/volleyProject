/**
 * TeamRegistrationDetail — the full view of one team application: captain and vice-captain contacts, team colors, prior league experience, and the submitted roster.
 * The submitter (and only the submitter) sees a Withdraw action while the application is still `pending` or `conflict`; it confirms through `ConfirmModal` before deleting.
 * Lives in `components/`; routed at /teams/registrations/:id.
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/authContext'
import { useTeamRegistration } from '@/hooks/useTeamRegistrations'
import { TEAMS_NAV_ITEMS } from '@/constants/teamsNav'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import DetailStats, { type DetailStatItem } from '@/components/ui/layout/DetailStats'
import SubNav from '@/components/ui/navigation/SubNav'
import LinkButton from '@/components/ui/buttons/LinkButton'
import Button from '@/components/ui/buttons/Button'
import ConfirmModal from '@/components/ui/modals/ConfirmModal'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import { PageLoader } from '@/components/ui/feedback/LoadingSpinner'
import { RegStatusBadge } from '@/components/ui/badges/RegStatusBadge'

/** Only these two states are still withdrawable — an accepted or denied application is final. */
const WITHDRAWABLE_STATUSES = ['pending', 'conflict']

export default function TeamRegistrationDetail() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const { data: row, loading, error, withdraw } = useTeamRegistration(id)
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  if (loading) return <PageLoader message="Loading registration…" />

  if (error || !row) {
    return (
      <PageContainer width="narrow">
        <SubNav items={TEAMS_NAV_ITEMS} />
        <ErrorNotice
          title="Registration not found"
          message={error || 'This application no longer exists.'}
          action={
            <LinkButton to="/teams/registrations" variant="secondary" size="sm">
              Back to registrations
            </LinkButton>
          }
        />
      </PageContainer>
    )
  }

  const isOwner = isAuthenticated && user?.id === row.submittedByUserId
  const canWithdraw = isOwner && WITHDRAWABLE_STATUSES.includes(row.status)

  const details: DetailStatItem[] = [
    { label: 'Captain', value: `${row.captainDiscord} / ${row.captainRoblox}` },
    ...(row.viceDiscord || row.viceRoblox
      ? [{ label: 'Vice captain', value: `${row.viceDiscord} / ${row.viceRoblox}` }]
      : []),
    ...(row.hexColor
      ? [
          {
            label: 'Colors',
            value: (
              <span className="inline-flex items-center gap-2">
                {/* The registered team color itself — a runtime value with no token. */}
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
    ...(row.priorLeagueExperience
      ? [{ label: 'Prior experience', value: row.priorLeagueExperience, wide: true }]
      : []),
  ]

  const handleWithdraw = async () => {
    setWithdrawing(true)
    const ok = await withdraw()
    setWithdrawing(false)
    setConfirmingWithdraw(false)
    if (ok) navigate('/teams/registrations')
  }

  return (
    <PageContainer width="wide">
      <SubNav
        items={[...TEAMS_NAV_ITEMS, { label: row.teamName, to: `/teams/registrations/${row.id}` }]}
        activeLabel={row.teamName}
      />

      <PageHeader
        title={row.teamName}
        actions={<RegStatusBadge status={row.status} />}
      />

      <Card padding="lg">
        <DetailStats items={details} columns={3} />
      </Card>

      {row.roster && row.roster.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Roster" count={row.roster.length} />
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {row.roster.map((player, index) => (
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
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <LinkButton to="/teams/registrations" variant="outline" size="sm">
          ← Back to registrations
        </LinkButton>
        {canWithdraw && (
          <Button variant="danger" size="sm" onClick={() => setConfirmingWithdraw(true)}>
            Withdraw application
          </Button>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmingWithdraw}
        onClose={() => setConfirmingWithdraw(false)}
        onConfirm={handleWithdraw}
        loading={withdrawing}
        title="Withdraw application"
        confirmLabel="Withdraw"
        message={
          <>
            Withdraw <strong>{row.teamName}</strong>&rsquo;s application? This removes it from the
            registration list and cannot be undone.
          </>
        }
      />
    </PageContainer>
  )
}
