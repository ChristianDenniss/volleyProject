/**
 * Schedules — the upcoming-games calendar: games grouped by day inside a two-week window the reader pages through, each day collapsible, with filters for season, stage, phase and division.
 * A match card shows both teams (crest, name, overall score and per-set scores when the game has finished), its start time in either league or local time, and links out to the broadcast and the stat sheet.
 * Lives in `components/`; routed at /schedules. The date-picker overlay is `CalendarModal`.
 */
import { useMemo, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGames, useSeasons } from '@/hooks/allFetch'
import { useRegion } from '@/context/regionContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatGameStage } from '@/utils/gameLabels'
import { isSafeExternalUrl } from '@/utils/url'
import type { Game } from '@/types/interfaces'
import SEO from '@/components/SEO'
import CalendarModal from '@/components/CalendarModal'

import PageContainer from '@/components/ui/layout/PageContainer'
import Toolbar from '@/components/ui/layout/Toolbar'
import Card from '@/components/ui/layout/Card'
import FilterBar from '@/components/ui/filters/FilterBar'
import FilterSelect from '@/components/ui/filters/FilterSelect'
import SearchBar from '@/components/ui/filters/SearchBar'
import IconButton from '@/components/ui/buttons/IconButton'
import Button from '@/components/ui/buttons/Button'
import LinkButton from '@/components/ui/buttons/LinkButton'
import Pill, { type PillTone } from '@/components/ui/pills/Pill'
import StatusBadge from '@/components/ui/badges/StatusBadge'
import Checkbox from '@/components/ui/inputs/Checkbox'
import EmptyState from '@/components/ui/feedback/EmptyState'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import { SkeletonCardGrid } from '@/components/ui/feedback/Skeleton'
import { TeamCrest } from '@/components/ui/cards/GameScoreCard'
import { toOptions } from '@/components/ui/inputs/Select'

/** The window the date navigation pages through, in days. */
const WINDOW_DAYS = 14

const PHASE_OPTIONS = [
  { value: 'pre_season', label: 'Pre-Season' },
  { value: 'qualifiers', label: 'Qualifiers' },
  { value: 'playoffs', label: 'Playoffs' },
]

const DIVISION_OPTIONS = toOptions(['Invitational', 'RVL', 'D-League'])

/** Division/stage tags carry a conventional colour. Matched loosely because the tag text is
 *  free-form on the game record ("RVL Playoffs", "D-League Qualifier", …). */
const TAG_TONE_RULES: { match: string[]; tone: PillTone }[] = [
  { match: ['rvl'], tone: 'info' },
  { match: ['playoff', 'winner'], tone: 'purple' },
  { match: ['d-league', 'dleague', 'qualifier'], tone: 'success' },
  { match: ['loser'], tone: 'danger' },
  { match: ['exhibition', 'pre-season'], tone: 'warning' },
]

function tagTone(tag: string): PillTone {
  const lower = tag.toLowerCase()
  return TAG_TONE_RULES.find((rule) => rule.match.some((m) => lower.includes(m)))?.tone ?? 'neutral'
}

/** Which side won, or null while the game is unplayed. Handles a forfeit, where one side has
 *  a score and the other is null. */
function winningSide(game: Game): 0 | 1 | null {
  if (game.status !== 'completed') return null

  const t1 = game.team1Score
  const t2 = game.team2Score
  if (t1 != null && t2 == null) return 0
  if (t2 != null && t1 == null) return 1
  if (t1 != null && t2 != null) return t1 > t2 ? 0 : 1
  return null
}

function setScoresFor(game: Game, side: 0 | 1): number[] {
  return [game.set1Score, game.set2Score, game.set3Score, game.set4Score, game.set5Score]
    .filter((score): score is string => Boolean(score))
    .map((score) => {
      const [a, b] = score.split('-').map(Number)
      return side === 0 ? a : b
    })
}

function formatDayHeading(dateKey: string): string {
  return new Date(dateKey).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatStartTime(value: string): string {
  const date = new Date(value)
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${time} • ${day}`
}

export default function Schedules() {
  const navigate = useNavigate()
  const { regionQuery } = useRegion()

  const { data: seasons, loading: seasonsLoading } = useSeasons(regionQuery)

  const [selectedSeason, setSelectedSeason] = useState<number | undefined>()
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedPhase, setSelectedPhase] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [windowStart, setWindowStart] = useState<Date>(new Date())
  const [showLocalTime, setShowLocalTime] = useState(false)
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { data: games, error, loading } = useGames({
    page: 1,
    limit: 500,
    seasonId: selectedSeason,
    search: debouncedSearch || undefined,
    stage: selectedStage || undefined,
    status: 'scheduled',
    phase: selectedPhase || undefined,
    ...regionQuery,
  })

  /** Stage options come from the loaded games, numerically sorted so "Round 10" follows "Round 9". */
  const stageOptions = useMemo(() => {
    const stages = Array.from(
      new Set((games ?? []).map((game) => game.stage).filter(Boolean) as string[])
    ).sort((a, b) => {
      const aNum = Number.parseInt(a.replace(/\D/g, ''), 10)
      const bNum = Number.parseInt(b.replace(/\D/g, ''), 10)
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum
      return a.localeCompare(b)
    })
    return toOptions(stages)
  }, [games])

  const seasonOptions = useMemo(
    () =>
      (seasons ?? []).map((season) => ({
        value: String(season.id),
        label: `Season ${season.seasonNumber}`,
      })),
    [seasons]
  )

  const filteredGames = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return (games ?? []).filter((game) => {
      const team1 = game.teams?.[0]?.name ?? ''
      const team2 = game.teams?.[1]?.name ?? ''
      const label = game.name ?? `${team1} vs ${team2}`

      const matchesStage = !selectedStage || game.stage === selectedStage
      const matchesSearch =
        label.toLowerCase().includes(query) ||
        team1.toLowerCase().includes(query) ||
        team2.toLowerCase().includes(query)
      const matchesTag =
        !selectedTag ||
        (game.tags ?? []).some((tag) => tag.toLowerCase().includes(selectedTag.toLowerCase()))

      return matchesStage && matchesSearch && matchesTag
    })
  }, [games, selectedStage, searchQuery, selectedTag])

  const gamesByDate = useMemo(() => {
    const grouped: Record<string, Game[]> = {}
    for (const game of filteredGames) {
      const key = new Date(game.date).toDateString()
      ;(grouped[key] ??= []).push(game)
    }
    return grouped
  }, [filteredGames])

  /** The visible window runs from the Sunday of `windowStart`'s week for WINDOW_DAYS days. */
  const { rangeStart, rangeEnd } = useMemo(() => {
    const start = new Date(windowStart)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + WINDOW_DAYS - 1)
    return { rangeStart: start, rangeEnd: end }
  }, [windowStart])

  const visibleDates = useMemo(
    () =>
      Object.keys(gamesByDate)
        .filter((key) => {
          const date = new Date(key)
          return date >= rangeStart && date < rangeEnd
        })
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [gamesByDate, rangeStart, rangeEnd]
  )

  const shiftWindow = (days: number) => {
    const next = new Date(windowStart)
    next.setDate(next.getDate() + days)
    setWindowStart(next)
  }

  const toggleDate = (dateKey: string) =>
    setCollapsedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateKey)) next.delete(dateKey)
      else next.add(dateKey)
      return next
    })

  const stopCardNavigation = (event: ReactMouseEvent | KeyboardEvent) => event.stopPropagation()

  const openGame = (gameId: number) => navigate(`/games/${gameId}`)

  const activeFilterCount = [
    selectedSeason ? '1' : '',
    selectedStage,
    selectedPhase,
    selectedTag,
    searchQuery,
  ].filter(Boolean).length

  const clearFilters = () => {
    setSelectedSeason(undefined)
    setSelectedStage('')
    setSelectedPhase('')
    setSelectedTag('')
    setSearchQuery('')
  }

  const formatRangeLabel = (date: Date) =>
    date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  if (error) {
    return (
      <PageContainer width="wide">
        <ErrorNotice message={error} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      <SEO
        title="Schedules"
        description="Upcoming Roblox Volleyball League match schedules, dates, and stages."
        url="https://volleyball4-2.com/schedules"
      />

      {/* Date window navigation */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
        <IconButton
          icon={<span aria-hidden className="text-lg leading-none">&lsaquo;</span>}
          label="Previous two weeks"
          onClick={() => shiftWindow(-WINDOW_DAYS)}
        />
        <span className="text-sm font-medium tabular-nums text-content">
          {formatRangeLabel(rangeStart)} – {formatRangeLabel(rangeEnd)}
        </span>
        <IconButton
          icon={<span aria-hidden className="text-lg leading-none">&rsaquo;</span>}
          label="Next two weeks"
          onClick={() => shiftWindow(WINDOW_DAYS)}
        />
        <Button variant="secondary" size="sm" onClick={() => setIsCalendarOpen(true)}>
          Pick a date
        </Button>
      </div>

      <Toolbar
        filters={
          <FilterBar onReset={clearFilters} activeCount={activeFilterCount}>
            <FilterSelect
              label="Season"
              value={selectedSeason ? String(selectedSeason) : ''}
              onChange={(value) => setSelectedSeason(value ? Number(value) : undefined)}
              options={seasonOptions}
              placeholder={seasonsLoading ? 'Loading seasons…' : 'All Seasons'}
            />
            <FilterSelect
              label="Stage"
              value={selectedStage}
              onChange={setSelectedStage}
              options={stageOptions}
              placeholder="All Stages"
            />
            <FilterSelect
              label="Phase"
              value={selectedPhase}
              onChange={setSelectedPhase}
              options={PHASE_OPTIONS}
              placeholder="All Phases"
            />
            <FilterSelect
              label="Division"
              value={selectedTag}
              onChange={setSelectedTag}
              options={DIVISION_OPTIONS}
              placeholder="All Divisions"
            />
          </FilterBar>
        }
        trailing={
          <>
            <SearchBar
              value={searchQuery}
              onSearch={setSearchQuery}
              placeholder="Search upcoming games…"
              className="w-full sm:w-64"
            />
            <Checkbox
              label="Show local match time"
              checked={showLocalTime}
              onChange={(e) => setShowLocalTime(e.target.checked)}
            />
          </>
        }
      />

      {loading ? (
        <SkeletonCardGrid count={4} height="h-52" />
      ) : visibleDates.length === 0 ? (
        <EmptyState label="No upcoming games found for the selected criteria." />
      ) : (
        <div className="flex flex-col gap-6">
          {visibleDates.map((dateKey) => {
            const collapsed = collapsedDates.has(dateKey)
            return (
              <section key={dateKey} className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => toggleDate(dateKey)}
                  aria-expanded={!collapsed}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-card border border-border bg-surface-inset px-4 py-3 text-left transition-colors hover:bg-surface"
                >
                  <h2 className="m-0 text-base font-semibold text-content">
                    {formatDayHeading(dateKey)}
                  </h2>
                  <span
                    aria-hidden
                    className={`text-xs text-content-tertiary transition-transform ${collapsed ? '-rotate-90' : ''}`}
                  >
                    ▼
                  </span>
                </button>

                {!collapsed && (
                  <div className="flex flex-col gap-3">
                    {gamesByDate[dateKey].map((game) => {
                      const winner = winningSide(game)
                      const team1 = game.teams?.[0]
                      const team2 = game.teams?.[1]
                      const label =
                        game.name ?? `${team1?.name ?? 'TBD'} vs ${team2?.name ?? 'TBD'}`

                      return (
                        <Card
                          key={game.id}
                          padding="none"
                          interactive
                          onClick={() => openGame(game.id)}
                          className="focus-visible:border-accent"
                        >
                          <div
                            role="link"
                            tabIndex={0}
                            aria-label={`View game: ${label}`}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openGame(game.id)
                              }
                            }}
                          >
                            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                              <div className="flex min-w-0 flex-col gap-1">
                                {game.tags && game.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5" aria-label="Game tags">
                                    {game.tags.map((tag) => (
                                      <Pill key={tag} tone={tagTone(tag)} size="sm">
                                        {tag}
                                      </Pill>
                                    ))}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-content">
                                  Upcoming {formatGameStage(game)} · {label}
                                </span>
                                <span className="text-xs text-content-muted">TBD Venue</span>
                              </div>
                              <StatusBadge status={game.status} />
                            </header>

                            <div className="flex flex-col divide-y divide-border">
                              {([0, 1] as const).map((side) => {
                                const team = side === 0 ? team1 : team2
                                const score = side === 0 ? game.team1Score : game.team2Score
                                const isWinner = winner === side
                                const sets = setScoresFor(game, side)

                                return (
                                  <div
                                    key={side}
                                    className={`flex items-center justify-between gap-3 px-4 py-3 ${isWinner ? 'bg-status-success/8' : ''}`}
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <TeamCrest
                                        team={team ?? null}
                                        name={team?.name ?? 'TBD'}
                                        muted={winner !== null && !isWinner}
                                      />
                                      {team?.name ? (
                                        <Link
                                          to={`/teams/${encodeURIComponent(team.name)}`}
                                          onClick={stopCardNavigation}
                                          className={`min-w-0 truncate text-sm no-underline hover:underline ${isWinner ? 'font-semibold text-content' : 'text-content-secondary'}`}
                                        >
                                          {team.name}
                                        </Link>
                                      ) : (
                                        <span className="text-sm text-content-muted">TBD</span>
                                      )}
                                    </div>

                                    {game.status === 'completed' && score != null && (
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`text-lg font-bold tabular-nums ${isWinner ? 'text-content' : 'text-content-tertiary'}`}
                                        >
                                          {score}
                                        </span>
                                        {sets.length > 0 && (
                                          <div className="flex gap-1">
                                            {sets.map((setScore, index) => (
                                              <span
                                                key={index}
                                                className="min-w-6 rounded-control bg-surface-inset px-1.5 text-center text-xs tabular-nums text-content-tertiary"
                                              >
                                                {setScore}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-inset px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-content-muted">
                                  Start Time
                                </span>
                                <span className="text-sm tabular-nums text-content-secondary">
                                  {game.date ? formatStartTime(game.date.toString()) : 'TBD'}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-2" onClick={stopCardNavigation}>
                                {isSafeExternalUrl(game.videoUrl) ? (
                                  <LinkButton to={game.videoUrl!} external variant="secondary" size="sm">
                                    Watch
                                  </LinkButton>
                                ) : (
                                  <Button variant="secondary" size="sm" disabled>
                                    Watch
                                  </Button>
                                )}
                                {game.status === 'completed' && (
                                  <LinkButton to={`/games/${game.id}`} size="sm">
                                    Stats
                                  </LinkButton>
                                )}
                              </div>
                            </footer>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      <Card tone="inset" padding="lg">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-lg font-semibold text-content">
            Stay Updated with 4.2 Schedules
          </h2>
          <p className="m-0 text-sm leading-relaxed text-content-secondary">
            The Roblox Volleyball League (RVL) 4.2 season brings together the most competitive teams
            from around the world in many different exciting tournament formats. Staying updated
            with the upcoming volleyball game schedules is essential to ensure you never miss a
            moment of the elite action. Our platform here provides the most accurate and up-to-date
            information on match schedules, results, and comprehensive statistics for the RVL/4.2
            volleyball seasons.
          </p>
        </div>
      </Card>

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentDateRange={windowStart}
        onDateRangeChange={setWindowStart}
      />
    </PageContainer>
  )
}
