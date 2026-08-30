/**
 * SingleGame — one match's page: its stage and season metadata, the scoreboard with the winning side emphasised, and the full per-player stat table for both rosters.
 * A scheduled game shows a "not yet played" notice with the kick-off time instead of an empty stat table, and the stat rows are tinted by team so the two rosters read apart without a second table.
 * Lives in `components/Single/`; routed at /games/:id.
 */
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { FaLayerGroup, FaVolleyballBall, FaVideo, FaVideoSlash, FaRegCalendarAlt, FaCalendarDay } from 'react-icons/fa'
import { useSingleGames } from '@/hooks/allFetch'
import { isSafeExternalUrl } from '@/utils/url'
import { formatGameStage } from '@/utils/gameLabels'
import type { Game, Stats } from '@/types/interfaces'
import SEO from '@/components/SEO'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import DataTable, { type DataTableColumn, type RowTone } from '@/components/ui/layout/DataTable'
import Pill from '@/components/ui/pills/Pill'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import Skeleton, { SkeletonTable } from '@/components/ui/feedback/Skeleton'

/** The per-player statistic columns, in scouting-sheet order. */
const STAT_COLUMNS: { key: keyof Stats; header: string }[] = [
  { key: 'spikeKills', header: 'Spike Kills' },
  { key: 'spikeAttempts', header: 'Spike Attempts' },
  { key: 'apeKills', header: 'Ape Kills' },
  { key: 'apeAttempts', header: 'Ape Attempts' },
  { key: 'spikingErrors', header: 'Spiking Errors' },
  { key: 'digs', header: 'Digs' },
  { key: 'blockFollows', header: 'Block Follows' },
  { key: 'blocks', header: 'Blocks' },
  { key: 'assists', header: 'Assists' },
  { key: 'settingErrors', header: 'Setting Errors' },
  { key: 'aces', header: 'Aces' },
  { key: 'servingErrors', header: 'Serve Errors' },
  { key: 'miscErrors', header: 'Misc Errors' },
]

/**
 * Which side won. Prefers the explicit winner relation; falls back to comparing scores on a
 * completed game, and returns null for a scheduled game or a recorded tie.
 */
function winningSide(game: Game): 0 | 1 | null {
  const winnerId = game.winnerTeamId ?? game.winner?.id ?? null
  if (winnerId != null && game.teams?.length) {
    const index = game.teams.findIndex((team) => team.id === winnerId)
    if (index === 0 || index === 1) return index
  }

  if (game.status !== 'completed') return null

  const { team1Score: a, team2Score: b } = game
  if (a != null && b != null && a !== b) return a > b ? 0 : 1
  return null
}

/** The endpoint returns a bare game, a `{ games: [...] }` envelope, or an array. */
function normaliseGames(data: unknown): Game[] {
  if (Array.isArray(data)) return data as Game[]
  if (data && typeof data === 'object' && 'games' in data) {
    const games = (data as { games?: unknown }).games
    if (Array.isArray(games)) return games as Game[]
  }
  return data ? [data as Game] : []
}

export default function SingleGame() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading } = useSingleGames(id ?? '')

  const game = useMemo(() => {
    const games = normaliseGames(data)
    if (games.length === 0) return null
    return games.find((g) => g.id === Number(id)) ?? games[0]
  }, [data, id])

  if (!id) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message="URL ID is undefined" />
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer width="wide">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-32 w-full !rounded-card" />
        <SkeletonTable rows={8} />
      </PageContainer>
    )
  }

  if (error || !game) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message={error || 'Game not found.'} />
      </PageContainer>
    )
  }

  const isUpcoming = game.status === 'scheduled'
  const winner = isUpcoming ? null : winningSide(game)

  const team1 = game.teams?.[0] ?? { name: 'Team 1', players: [] }
  const team2 = game.teams?.[1] ?? { name: 'Team 2', players: [] }

  const team1Stats = (game.stats ?? []).filter((stat) =>
    team1.players?.some((player) => player.id === stat.player.id)
  )
  const team2Stats = (game.stats ?? []).filter((stat) =>
    team2.players?.some((player) => player.id === stat.player.id)
  )
  const allStats = [...team1Stats, ...team2Stats]
  const team2StatIds = new Set(team2Stats.map((stat) => stat.id))

  const totalSets = (game.team1Score ?? 0) + (game.team2Score ?? 0)
  const gameDate = new Date(game.date)
  const formattedDate = gameDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = gameDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  const columns: DataTableColumn<Stats>[] = [
    {
      key: 'player',
      header: 'Player',
      render: (row) => <span className="font-medium text-content">{row.player.name}</span>,
    },
    ...STAT_COLUMNS.map<DataTableColumn<Stats>>((column) => ({
      key: String(column.key),
      header: column.header,
      align: 'center',
      render: (row) => <span className="tabular-nums">{String(row[column.key])}</span>,
    })),
  ]

  /** Score column styling: the winning side reads solid, the losing side muted. */
  const scoreClasses = (side: 0 | 1) =>
    winner === null
      ? 'text-content'
      : winner === side
        ? 'text-status-success'
        : 'text-content-muted'

  return (
    <PageContainer width="wide">
      <SEO
        title={isUpcoming ? `${game.name} - Upcoming Match` : `${game.name} - Game Results`}
        description={
          isUpcoming
            ? `${team1.name} vs ${team2.name} - Upcoming ${formatGameStage(game)} match from Season ${game.season.seasonNumber} of the Roblox Volleyball League.`
            : `${team1.name} vs ${team2.name} - Final Score: ${game.team1Score}-${game.team2Score}. ${formatGameStage(game)} match from Season ${game.season.seasonNumber} of the Roblox Volleyball League.`
        }
        image="https://volleyball4-2.com/rvlLogo.png"
        url={`https://volleyball4-2.com/games/${game.id}`}
        type="sports_event"
        publishedTime={gameDate.toISOString()}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: game.name,
          description: `${team1.name} vs ${team2.name} - ${formatGameStage(game)} match`,
          url: `https://volleyball4-2.com/games/${game.id}`,
          startDate: gameDate.toISOString(),
          endDate: gameDate.toISOString(),
          location: { '@type': 'Place', name: 'Roblox Volleyball League' },
          organizer: {
            '@type': 'SportsOrganization',
            name: 'Roblox Volleyball League',
            url: 'https://volleyball4-2.com',
          },
          competitor: [
            { '@type': 'SportsTeam', name: team1.name, score: game.team1Score },
            { '@type': 'SportsTeam', name: team2.name, score: game.team2Score },
          ],
          sport: 'Volleyball',
          season: {
            '@type': 'SportsSeason',
            name: `Season ${game.season.seasonNumber}`,
            seasonNumber: game.season.seasonNumber,
          },
        }}
      />

      <PageHeader
        title={game.name}
        subtitle={formatGameStage(game)}
        actions={<Pill tone="accent">Season {game.season.seasonNumber}</Pill>}
      />

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-content-secondary">
        <span className="flex items-center gap-2">
          <FaLayerGroup aria-hidden className="text-content-muted" />
          Season {game.season.seasonNumber}
        </span>
        <span className="flex items-center gap-2">
          <FaVolleyballBall aria-hidden className="text-content-muted" />
          Total Sets Played {totalSets}
        </span>
        {isSafeExternalUrl(game.videoUrl) ? (
          <span className="flex items-center gap-2">
            <FaVideo aria-hidden className="text-content-muted" />
            Video:{' '}
            <a
              href={game.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent no-underline hover:underline"
            >
              Watch Here
            </a>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-content-muted">
            <FaVideoSlash aria-hidden />
            No Video Found
          </span>
        )}
        <span className="flex items-center gap-2">
          <FaRegCalendarAlt aria-hidden className="text-content-muted" />
          {formattedDate}
          {isUpcoming && <> at {formattedTime}</>}
        </span>
      </div>

      <Card padding="lg">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className={`text-5xl font-bold tabular-nums ${scoreClasses(0)}`}>
              {isUpcoming ? '—' : (game.team1Score ?? '—')}
            </span>
            <span className="text-sm font-medium text-content-secondary">{team1.name}</span>
          </div>

          <span className="text-sm uppercase tracking-widest text-content-muted">vs</span>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className={`text-5xl font-bold tabular-nums ${scoreClasses(1)}`}>
              {isUpcoming ? '—' : (game.team2Score ?? '—')}
            </span>
            <span className="text-sm font-medium text-content-secondary">{team2.name}</span>
          </div>
        </div>
      </Card>

      {isUpcoming ? (
        <EmptyState
          icon={<FaCalendarDay />}
          title="Match Not Yet Played"
          description={`This game is scheduled for ${formattedDate} at ${formattedTime}. Player statistics will be available here after the match is completed.`}
        />
      ) : allStats.length === 0 ? (
        <EmptyState label="No statistics have been recorded for this game." />
      ) : (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Player Statistics" count={allStats.length} />
          <DataTable
            columns={columns}
            rows={allStats}
            rowKey={(row) => row.id}
            density="compact"
            /* Tint the away roster so the two teams read apart in one table. */
            rowTone={(row): RowTone => (team2StatIds.has(row.id) ? 'accent' : 'default')}
          />
        </section>
      )}
    </PageContainer>
  )
}
