/**
 * SinglePlayer — a player's profile: their avatar and identity, career or per-season stat totals with per-game averages, the teams and games they've appeared in, their awards (including championship rings), and their Hall of Fame progress.
 * Stats can be scoped by region and by season; both filters re-derive the totals, the averages and the HOF score together, so the whole page always describes one consistent slice of the career.
 * Lives in `components/Single/`; routed at /players/:id. The HOF scoring model lives in `utils/hallOfFame`.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTrophy,
  faVolleyballBall,
  faMedal,
  faCrown,
  faAward,
  faShieldAlt,
  faHandSparkles,
  faBolt,
  faCrosshairs,
  faUserShield,
  faShield,
  faLock,
  faStar,
  faRing,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { useSinglePlayer, useAwardsByPlayerID } from '@/hooks/allFetch'
import { useRegion } from '@/context/regionContext'
import { getRobloxAvatarUrl } from '@/utils/fetchAvatarRoblox'
import { countChampionships, calculateHofScore, hofProgressPercent, HOF_INDUCTION_SCORE } from '@/utils/hallOfFame'
import { STAT_TOTAL_FIELDS, sumStats } from '@/utils/statTotals'
import type { RegionCode } from '@/types/interfaces'
import SEO from '@/components/SEO'

import PageContainer from '@/components/ui/layout/PageContainer'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import DetailStats from '@/components/ui/layout/DetailStats'
import Tabs from '@/components/ui/navigation/Tabs'
import Button from '@/components/ui/buttons/Button'
import Pill from '@/components/ui/pills/Pill'
import Avatar from '@/components/ui/misc/Avatar'
import FormField from '@/components/ui/inputs/FormField'
import Select from '@/components/ui/inputs/Select'
import ProgressBar from '@/components/ui/feedback/ProgressBar'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import Skeleton from '@/components/ui/feedback/Skeleton'

/** Award type → its trophy glyph. Unlisted types fall back to a generic trophy. */
const AWARD_ICONS: Record<string, IconDefinition> = {
  MVP: faTrophy,
  'Best Spiker': faVolleyballBall,
  'Best Setter': faHandSparkles,
  'Best Libero': faShieldAlt,
  'Best Server': faCrosshairs,
  'Best Blocker': faLock,
  'Best Aper': faBolt,
  'Best Receiver': faUserShield,
  DPOS: faShield,
  FMVP: faCrown,
  MIP: faMedal,
  'LuvLate Award': faAward,
}

/** How many games are listed before the "See More Games" toggle. */
const VISIBLE_GAMES = 5

/** The season currently treated as "now" for the Current Team line. */
const CURRENT_SEASON_NUMBER = 14

const CAREER_OPTION_VALUE = '0'

export default function PlayerProfiles() {
  const { id } = useParams<{ id: string }>()
  const { regions } = useRegion()

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profileRegion, setProfileRegion] = useState<'all' | RegionCode>('all')
  const [selectedSeason, setSelectedSeason] = useState(0)
  const [showAllGames, setShowAllGames] = useState(false)

  const regionFilter = profileRegion === 'all' ? undefined : profileRegion
  const { data: player, error, loading } = useSinglePlayer(id || '', regionFilter)
  const {
    data: awards,
    loading: awardsLoading,
    error: awardsError,
  } = useAwardsByPlayerID(id || '', regionFilter)

  useEffect(() => {
    if (!player?.name) return
    getRobloxAvatarUrl(player.name)
      .then((url) => {
        if (url) setAvatarUrl(url)
      })
      .catch((err) => console.error('Error fetching avatar:', err))
  }, [player?.name])

  const allStats = useMemo(() => (Array.isArray(player?.stats) ? player.stats : []), [player])

  const seasonOptions = useMemo(() => {
    const seasons = Array.from(
      new Set(
        allStats
          .map((stat) => stat.game?.season?.seasonNumber)
          .filter((num): num is number => typeof num === 'number')
      )
    ).sort((a, b) => a - b)

    return [
      { value: CAREER_OPTION_VALUE, label: 'Career' },
      ...seasons.map((season) => ({ value: String(season), label: `Season ${season}` })),
    ]
  }, [allStats])

  const filteredStats = useMemo(
    () =>
      selectedSeason === 0
        ? allStats
        : allStats.filter((stat) => stat.game?.season?.seasonNumber === selectedSeason),
    [allStats, selectedSeason]
  )

  /** Totals for the selected slice, plus the games-played count the HOF model needs. */
  const totals = useMemo(
    () => ({ ...sumStats(filteredStats), gamesPlayed: filteredStats.length }),
    [filteredStats]
  )

  const dedupedGames = useMemo(() => {
    const seen = new Set<number>()
    return (player?.teams ?? [])
      .flatMap((team) => team.games || [])
      .filter((game) => {
        if (seen.has(game.id)) return false
        seen.add(game.id)
        return true
      })
  }, [player])

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
        <Skeleton className="h-28 w-full !rounded-panel" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full !rounded-card" />
      </PageContainer>
    )
  }

  if (error || !player) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message={error || 'No player found.'} />
      </PageContainer>
    )
  }

  const perGame = (value: number) =>
    totals.gamesPlayed ? (value / totals.gamesPlayed).toFixed(1) : '0'

  const currentTeam =
    player.teams?.find((team) => team.season?.seasonNumber === CURRENT_SEASON_NUMBER)?.name ??
    'Not Active'

  const mostRecentTeam =
    player.teams?.reduce<(typeof player.teams)[number] | null>((recent, team) => {
      if (!team.season) return recent
      if (!recent || team.season.id > recent.season!.id) return team
      return recent
    }, null)?.name ?? 'N/A'

  const visibleGames = showAllGames ? dedupedGames : dedupedGames.slice(0, VISIBLE_GAMES)
  const championships = countChampionships(player)
  const hofScore = calculateHofScore(player, awards ?? [], totals)
  const isGoat = hofScore === Infinity
  const hofPercent = hofProgressPercent(hofScore)

  const teamSlug = (name: string) => encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))

  return (
    <PageContainer width="wide">
      <SEO
        title={`${player.name} - Player Profile`}
        description={`${player.name} is a ${player.position} in the Roblox Volleyball League. View stats, teams, awards, and career highlights.`}
        image={avatarUrl || 'https://volleyball4-2.com/rvlLogo.png'}
        url={`https://volleyball4-2.com/players/${player.id}`}
        type="profile"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: player.name,
          jobTitle: player.position,
          description: `${player.name} is a ${player.position} in the Roblox Volleyball League`,
          image: avatarUrl || 'https://volleyball4-2.com/rvlLogo.png',
          url: `https://volleyball4-2.com/players/${player.id}`,
          worksFor: {
            '@type': 'Organization',
            name: 'Roblox Volleyball League',
            url: 'https://volleyball4-2.com',
          },
          knowsAbout: ['Volleyball', 'Gaming', 'Sports'],
          alumniOf:
            player.teams?.map((team) => ({
              '@type': 'SportsTeam',
              name: team.name,
              url: `https://volleyball4-2.com/teams/${teamSlug(team.name)}`,
            })) || [],
        }}
      />

      {/* Hero — deliberately dark in a light app, hence the inverse surface tokens. */}
      <header className="flex flex-wrap items-center gap-6 rounded-panel bg-surface-inverse p-6 text-content-inverse">
        <Avatar src={avatarUrl} name={player.name} size="xl" shape="circle" />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="m-0 text-page-title font-semibold leading-tight">{player.name}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-content-inverse/80">
            <span>Position: {player.position}</span>
            <span>Current Team: {currentTeam}</span>
            <span>Most Recent Team: {mostRecentTeam}</span>
            <span>Total Teams: {player.teams?.length || 0}</span>
            <span>Possible Games Played: {dedupedGames.length}</span>
            <span>Total Stat Entries: {filteredStats.length}</span>
          </div>
        </div>
      </header>

      <Tabs
        variant="segmented"
        activeKey={profileRegion}
        onChange={(key) => setProfileRegion(key as 'all' | RegionCode)}
        items={[
          { key: 'all', label: 'All Regions' },
          ...regions.map((region) => ({ key: region.code, label: region.name })),
        ]}
      />

      <FormField label="View stats for" className="max-w-xs">
        {(fieldId) => (
          <Select
            id={fieldId}
            value={String(selectedSeason)}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            options={seasonOptions}
          />
        )}
      </FormField>

      {filteredStats.length === 0 ? (
        <EmptyState label="No stats available for this season." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="lg">
            <SectionHeader
              title={selectedSeason === 0 ? 'Career Totals' : `Season ${selectedSeason} Totals`}
              level={3}
              className="mb-4"
            />
            <DetailStats
              columns={3}
              items={[
                ...STAT_TOTAL_FIELDS.map((field) => ({
                  label: field.label,
                  value: totals[field.key],
                })),
                { label: 'Games Played', value: totals.gamesPlayed },
              ]}
            />
          </Card>

          <Card padding="lg">
            <SectionHeader title="Per Game Averages" level={3} className="mb-4" />
            <DetailStats
              columns={3}
              items={STAT_TOTAL_FIELDS.map((field) => ({
                label: field.label,
                value: perGame(totals[field.key]),
              }))}
            />
          </Card>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeader title="Teams" count={player.teams?.length ?? 0} />
        {!player.teams?.length ? (
          <EmptyState label="No teams found." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {player.teams.map((team) => (
              <Link
                key={team.id}
                to={`/teams/${teamSlug(team.name)}`}
                className="rounded-full border border-status-info/30 bg-status-info/15 px-3 py-1 text-sm text-status-info no-underline transition-colors hover:bg-status-info/25"
              >
                {team.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Games Played"
          count={dedupedGames.length}
          actions={
            dedupedGames.length > VISIBLE_GAMES && (
              <Button variant="secondary" size="sm" onClick={() => setShowAllGames((v) => !v)}>
                {showAllGames ? 'Show Less' : 'See More Games'}
              </Button>
            )
          }
        />
        {dedupedGames.length === 0 ? (
          <EmptyState label="No games found." />
        ) : (
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {visibleGames.map((game) => (
              <li key={game.id}>
                <Link
                  to={`/games/${game.id}`}
                  className="block truncate rounded-card border border-border bg-surface px-3 py-2 text-sm text-content no-underline transition-colors hover:border-accent hover:text-accent"
                >
                  {game.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Awards" count={(awards?.length ?? 0) + (championships > 0 ? 1 : 0)} />
        {awardsLoading ? (
          <Skeleton className="h-24 w-full !rounded-card" />
        ) : awardsError ? (
          <ErrorNotice message="Error loading awards" />
        ) : !awards?.length && championships === 0 ? (
          <EmptyState label="No awards yet." />
        ) : (
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {championships > 0 && (
              <div className="flex flex-col items-center gap-2 rounded-card border border-status-gold/40 bg-status-gold/10 p-4 text-center">
                <div className="flex gap-1 text-2xl text-status-gold">
                  {Array.from({ length: Math.min(championships, 3) }).map((_, index) => (
                    <FontAwesomeIcon key={index} icon={faRing} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-content">Rings</span>
                <span className="text-xs text-content-tertiary">
                  {championships} Championship{championships > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {awards?.map((award) => (
              <Link
                key={award.id}
                to={`/awards/${award.id}`}
                className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-4 text-center no-underline transition-all hover:-translate-y-0.5 hover:border-status-gold hover:shadow-[var(--shadow-md)]"
              >
                <FontAwesomeIcon
                  icon={AWARD_ICONS[award.type] ?? faTrophy}
                  className="text-2xl text-status-gold"
                />
                <span className="text-sm font-semibold text-content">{award.type}</span>
                <Pill tone="neutral" size="sm">
                  Season {award.season.seasonNumber}
                </Pill>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Hall of Fame Progress" />
        <Card padding="lg" tone={isGoat ? 'accent' : 'surface'}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold">
              <FontAwesomeIcon icon={faStar} className="text-status-gold" />
              <span className={isGoat ? 'text-status-gold' : 'text-content'}>
                {isGoat ? '∞' : hofScore}
              </span>
              {!isGoat && (
                <span className="text-lg font-normal text-content-muted">
                  /{HOF_INDUCTION_SCORE}
                </span>
              )}
              {isGoat && <FontAwesomeIcon icon={faStar} className="text-status-gold" />}
            </div>

            <ProgressBar
              label="Hall of Fame progress"
              value={hofPercent}
              tone={isGoat || hofScore >= HOF_INDUCTION_SCORE ? 'gold' : 'accent'}
            />

            <p className="m-0 text-center text-sm font-medium">
              {isGoat ? (
                <span className="text-status-gold">G.O.A.T. — Hall of Fame Inducted!</span>
              ) : hofScore >= HOF_INDUCTION_SCORE ? (
                <span className="text-status-gold">
                  Hall of Fame Inducted! (+{hofScore - HOF_INDUCTION_SCORE} points)
                </span>
              ) : (
                <span className="text-content-tertiary">
                  {Math.round(hofPercent)}% to Hall of Fame
                </span>
              )}
            </p>
          </div>
        </Card>
      </section>
    </PageContainer>
  )
}
