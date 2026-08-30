/**
 * SingleSeason — a season's detail page: its theme and date range, a link into that season's awards, and a grid of team cards each showing its placement and full roster.
 * Card header colors cycle through the positional `teamAccentVar` rotation so adjacent cards stay visually distinct; the accent carries no meaning about the team itself.
 * Lives in `components/Single/`; routed at /seasons/:id.
 */
import { Link, useParams } from 'react-router-dom'
import { useSingleSeason } from '@/hooks/allFetch'
import type { Season, Team } from '@/types/interfaces'
import { teamAccentVar } from '@/constants/chartPalette'
import SEO from '@/components/SEO'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import CardGrid from '@/components/ui/layout/CardGrid'
import LinkButton from '@/components/ui/buttons/LinkButton'
import Pill from '@/components/ui/pills/Pill'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'

interface TeamCardProps {
  team: Team
  accent: string
  position: number
}

function TeamCard({ team, accent, position }: TeamCardProps) {
  return (
    <Link
      to={`/teams/${encodeURIComponent(team.name)}`}
      className="relative flex flex-col overflow-hidden rounded-card border border-border bg-surface no-underline transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      {/* The accent is a positional rotation token, resolved per card at render time. */}
      <span
        className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-content"
        style={{ backgroundColor: accent }}
      >
        {position}
      </span>

      <header
        className="flex flex-col gap-0.5 px-4 py-3 pl-13"
        style={{ backgroundColor: accent }}
      >
        <h3 className="m-0 truncate text-base font-semibold text-content">{team.name}</h3>
        <span className="text-xs text-content-secondary">#{team.id}</span>
      </header>

      {team.placement && (
        <div className="border-b border-border px-4 py-2">
          <Pill tone="neutral" size="sm">{team.placement}</Pill>
        </div>
      )}

      <ul className="scroll-inverse m-0 flex max-h-56 list-none flex-col gap-1 overflow-y-auto p-4 text-sm">
        {team.players?.map((player, index) => (
          <li key={player.id} className="flex items-baseline gap-2">
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-content-muted">
              {index + 1}.
            </span>
            <span className="min-w-0 truncate text-content-secondary">{player.name}</span>
          </li>
        ))}
      </ul>
    </Link>
  )
}

export default function SingleSeason() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading } = useSingleSeason(id!)

  if (!id) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message="URL ID is undefined" />
      </PageContainer>
    )
  }

  // The endpoint returns either a single season or a one-element array depending on the route.
  const season: Season | undefined = Array.isArray(data) ? data[0] : (data ?? undefined)

  if (!loading && (error || !season)) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message={error || 'Season not found.'} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      {season && (
        <SEO
          title={`Season ${season.seasonNumber} - Roblox Volleyball League`}
          description={`Season ${season.seasonNumber} of the Roblox Volleyball League with theme "${season.theme}". View team standings, players, and results.`}
          image={season.image?.toString() || 'https://volleyball4-2.com/rvlLogo.png'}
          url={`https://volleyball4-2.com/seasons/${season.id}`}
          type="sports_event"
          publishedTime={new Date(season.startDate).toISOString()}
          structuredData={{
            '@context': 'https://schema.org',
            '@type': 'SportsSeason',
            name: `Season ${season.seasonNumber}`,
            description: `Season ${season.seasonNumber} of the Roblox Volleyball League`,
            url: `https://volleyball4-2.com/seasons/${season.id}`,
            seasonNumber: season.seasonNumber,
            startDate: new Date(season.startDate).toISOString(),
            endDate: season.endDate ? new Date(season.endDate).toISOString() : undefined,
            sport: 'Volleyball',
            league: {
              '@type': 'SportsOrganization',
              name: 'Roblox Volleyball League',
              url: 'https://volleyball4-2.com',
            },
            team:
              season.teams?.map((team) => ({
                '@type': 'SportsTeam',
                name: team.name,
                url: `https://volleyball4-2.com/teams/${encodeURIComponent(team.name.toLowerCase().replace(/\s+/g, '-'))}`,
                athlete:
                  team.players?.map((player) => ({
                    '@type': 'Person',
                    name: player.name,
                    url: `https://volleyball4-2.com/players/${player.id}`,
                  })) || [],
              })) || [],
          }}
        />
      )}

      <PageHeader
        title={season ? `Season ${season.seasonNumber}` : 'Season'}
        subtitle={
          season ? (
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Theme: {season.theme}</span>
              <span>Start: {new Date(season.startDate).toLocaleDateString()}</span>
              <span>
                End: {season.endDate ? new Date(season.endDate).toLocaleDateString() : 'TBD'}
              </span>
            </span>
          ) : undefined
        }
        actions={
          season && (
            <LinkButton to="/awards" state={{ selectedSeason: season.seasonNumber }}>
              View Awards
            </LinkButton>
          )
        }
      />

      <CardGrid
        loading={loading}
        loadingCount={8}
        loadingHeight="h-80"
        isEmpty={!season?.teams?.length}
        emptyLabel="No teams recorded for this season."
      >
        {season?.teams?.map((team, index) => (
          <TeamCard
            key={team.id}
            team={team}
            accent={teamAccentVar(index)}
            position={index + 1}
          />
        ))}
      </CardGrid>
    </PageContainer>
  )
}
