/**
 * SingleTeam — a team's page: its season, placement and crest, the staff-edit panel when the viewer is on the team's staff, and three collapsible sections for the roster, the games played, and the team's aggregate stat totals.
 * Per-player and team totals both come from `utils/statTotals`, so the thirteen counters are summed and labelled in one place rather than re-reduced here.
 * Lives in `components/Single/`; routed at /teams/:teamName (the URL segment is the slugified name).
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSingleTeam } from '@/hooks/allFetch'
import { formatGameStage } from '@/utils/gameLabels'
import { killPercentage, statTotalItems, sumStats } from '@/utils/statTotals'
import type { Game, Player, Stats } from '@/types/interfaces'
import SEO from '@/components/SEO'
import TeamStaffEdit from '@/components/TeamStaffEdit'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import CardGrid from '@/components/ui/layout/CardGrid'
import DetailStats from '@/components/ui/layout/DetailStats'
import Accordion, { type AccordionItem } from '@/components/ui/misc/Accordion'
import Avatar from '@/components/ui/misc/Avatar'
import Button from '@/components/ui/buttons/Button'
import Pill from '@/components/ui/pills/Pill'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import Skeleton from '@/components/ui/feedback/Skeleton'

export default function SingleTeam() {
  const { teamName } = useParams<{ teamName: string }>()
  const normalisedName = teamName?.replace(/-/g, ' ').toLowerCase() || ''

  const { data: teamArray, loading, error } = useSingleTeam(normalisedName)
  const team = teamArray?.[0]

  const [showPlayers, setShowPlayers] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const [showTotals, setShowTotals] = useState(false)

  /** Every stat line from this team's games that belongs to a player on this roster. */
  const teamStats: Stats[] = useMemo(() => {
    if (!team) return []
    const rosterIds = new Set((team.players ?? []).map((player: Player) => player.id))
    return (team.games ?? [])
      .flatMap((game: Game) => game.stats ?? [])
      .filter((stat): stat is Stats => Boolean(stat) && rosterIds.has(stat.playerId))
  }, [team])

  const statsByPlayer = useMemo(() => {
    const map: Record<number, Stats[]> = {}
    for (const stat of teamStats) {
      ;(map[stat.playerId] ??= []).push(stat)
    }
    return map
  }, [teamStats])

  const teamTotals = useMemo(() => sumStats(teamStats), [teamStats])

  const rosterItems: AccordionItem[] = useMemo(() => {
    if (!team) return []
    return (team.players ?? []).map((player: Player) => {
      const lines = statsByPlayer[player.id] ?? []
      const totals = sumStats(lines)

      return {
        id: String(player.id),
        title: (
          <span className="flex flex-wrap items-center gap-2">
            <Avatar name={player.name} size="xs" />
            <Link
              to={`/players/${player.id}`}
              onClick={(event) => event.stopPropagation()}
              className="font-semibold text-content no-underline hover:text-accent hover:underline"
            >
              {player.name}
            </Link>
            {player.position && (
              <Pill tone="accent" size="sm">
                {player.position}
              </Pill>
            )}
          </span>
        ),
        content:
          lines.length > 0 ? (
            <DetailStats columns={4} items={statTotalItems(totals)} />
          ) : (
            <p className="m-0 text-sm text-content-muted">No stats available for this player.</p>
          ),
      }
    })
  }, [team, statsByPlayer])

  if (loading) {
    return (
      <PageContainer width="wide">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-24 w-full !rounded-card" />
        <Skeleton className="h-64 w-full !rounded-card" />
      </PageContainer>
    )
  }

  if (error || !team) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message={error || 'Team not found.'} />
      </PageContainer>
    )
  }

  const teamSlug = encodeURIComponent(team.name.toLowerCase().replace(/\s+/g, '-'))

  return (
    <PageContainer width="wide">
      <SEO
        title={`${team.name} - Team Profile`}
        description={`${team.name} finished ${team.placement} in Season ${team.season.seasonNumber} of the Roblox Volleyball League. View team stats, players, and game results.`}
        image="https://volleyball4-2.com/rvlLogo.png"
        url={`https://volleyball4-2.com/teams/${teamSlug}`}
        type="sports_event"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SportsTeam',
          name: team.name,
          description: `${team.name} finished ${team.placement} in Season ${team.season.seasonNumber}`,
          url: `https://volleyball4-2.com/teams/${teamSlug}`,
          sport: 'Volleyball',
          league: {
            '@type': 'SportsOrganization',
            name: 'Roblox Volleyball League',
            url: 'https://volleyball4-2.com',
          },
          season: {
            '@type': 'SportsSeason',
            name: `Season ${team.season.seasonNumber}`,
            seasonNumber: team.season.seasonNumber,
          },
          athlete:
            team.players?.map((player) => ({
              '@type': 'Person',
              name: player.name,
              jobTitle: player.position,
              url: `https://volleyball4-2.com/players/${player.id}`,
            })) || [],
          location: { '@type': 'Place', name: 'Roblox Volleyball League' },
        }}
      />

      <PageHeader
        title={team.name}
        icon={
          team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt=""
              className="h-12 w-12 rounded-full border border-border object-contain"
            />
          ) : undefined
        }
        actions={<Pill tone="accent">Season {team.season.seasonNumber ?? 'N/A'}</Pill>}
      />

      <Card padding="lg">
        <DetailStats
          columns={3}
          items={[
            { label: 'Season', value: team.season.seasonNumber ?? 'N/A' },
            { label: 'Playoff Games Played', value: team.games?.length ?? 0 },
            { label: 'Placement', value: team.placement },
          ]}
        />
      </Card>

      <TeamStaffEdit team={team} />

      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Players"
          count={team.players?.length ?? 0}
          actions={
            <Button variant="secondary" size="sm" onClick={() => setShowPlayers((v) => !v)}>
              {showPlayers ? 'Hide Players' : 'Show Players'}
            </Button>
          }
        />
        {showPlayers &&
          (rosterItems.length > 0 ? (
            <Accordion items={rosterItems} />
          ) : (
            <EmptyState label="No players on this roster." />
          ))}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Games"
          count={team.games?.length ?? 0}
          actions={
            <Button variant="secondary" size="sm" onClick={() => setShowGames((v) => !v)}>
              {showGames ? 'Hide Games' : 'Show Games'}
            </Button>
          }
        />
        {showGames && (
          <CardGrid
            isEmpty={!team.games?.length}
            emptyLabel="No playoff games found."
            minColumnWidth="md"
          >
            {(team.games ?? []).map((game: Game) => (
              <Link
                key={game.id}
                to={`/games/${game.id}`}
                className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-md)]"
              >
                <h3 className="m-0 truncate text-sm font-semibold text-content">{game.name}</h3>
                <DetailStats
                  columns={2}
                  items={[
                    { label: 'Date', value: new Date(game.date).toLocaleDateString() },
                    { label: 'Score', value: `${game.team1Score ?? '—'} - ${game.team2Score ?? '—'}` },
                    { label: 'Season', value: team.season?.seasonNumber ?? 'N/A' },
                    { label: 'Stage', value: formatGameStage(game) },
                  ]}
                />
              </Link>
            ))}
          </CardGrid>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Team Totals"
          actions={
            <Button variant="secondary" size="sm" onClick={() => setShowTotals((v) => !v)}>
              {showTotals ? 'Hide Team Totals' : 'Show Team Totals'}
            </Button>
          }
        />
        {showTotals &&
          (teamStats.length > 0 ? (
            <Card padding="lg">
              <DetailStats
                columns={4}
                items={[
                  ...statTotalItems(teamTotals),
                  {
                    label: 'Spike %',
                    value: killPercentage(teamTotals.spikeKills, teamTotals.spikeAttempts),
                  },
                ]}
              />
            </Card>
          ) : (
            <EmptyState label="No stats recorded for this team yet." />
          ))}
      </section>
    </PageContainer>
  )
}
