/**
 * StatsLeaderboard — the sortable stat leaderboard for players or teams: every tracked statistic as a toggleable column, scoped by season, playoff round and totals/per-game/per-set, with an advanced filter that adds numeric conditions on any stat.
 * A player row expands into `PlayerStatsVisualization`; team rows do not, because the visualisation is a per-player archetype view.
 * Lives in `components/`; routed at /stats. `STAT_COLUMNS` is the single list driving the columns, the column-picker and the advanced filter's stat choices.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLeaderboard } from '@/hooks/allFetch'
import { useRegion } from '@/context/regionContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import PlayerStatsVisualization from '@/components/PlayerStatsVisualization'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Toolbar from '@/components/ui/layout/Toolbar'
import Card from '@/components/ui/layout/Card'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import FilterSelect from '@/components/ui/filters/FilterSelect'
import SearchBar from '@/components/ui/filters/SearchBar'
import ColumnToggleMenu from '@/components/ui/filters/ColumnToggleMenu'
import Pagination from '@/components/ui/navigation/Pagination'
import Button from '@/components/ui/buttons/Button'
import IconButton from '@/components/ui/buttons/IconButton'
import LinkButton from '@/components/ui/buttons/LinkButton'
import Select from '@/components/ui/inputs/Select'
import TextInput from '@/components/ui/inputs/TextInput'
import EmptyState from '@/components/ui/feedback/EmptyState'

const ROWS_PER_PAGE = 25
/** Seasons offered in the season filter. */
const SEASON_COUNT = 14

type StatType = 'total' | 'perGame' | 'perSet'
type ViewType = 'player' | 'team'
type ComparisonOperator = '==' | '!=' | '>' | '>=' | '<' | '<='
type StageRound = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'all'

/**
 * Every leaderboard statistic: its API key, its column label, and whether it is shown by
 * default. Percentage stats are stored 0–1 and rendered as a percentage.
 */
const STAT_COLUMNS = [
  { key: 'spikeKills', label: 'Spike Kills', default: false },
  { key: 'spikeAttempts', label: 'Spike Attempts', default: false },
  { key: 'Spike%', label: 'Spike %', default: false, percent: true },
  { key: 'apeKills', label: 'Ape Kills', default: false },
  { key: 'apeAttempts', label: 'Ape Attempts', default: false },
  { key: 'Ape%', label: 'Ape %', default: false, percent: true },
  { key: 'totalKills', label: 'Total Kills', default: true },
  { key: 'totalAttempts', label: 'Total Attempts', default: true },
  { key: 'totalSpike%', label: 'Total Spike %', default: true, percent: true },
  { key: 'spikingErrors', label: 'Spiking Errors', default: false },
  { key: 'blocks', label: 'Blocks', default: true },
  { key: 'assists', label: 'Assists', default: true },
  { key: 'settingErrors', label: 'Setting Errors', default: false },
  { key: 'digs', label: 'Digs', default: false },
  { key: 'blockFollows', label: 'Block Follows', default: false },
  { key: 'totalReceives', label: 'Total Receives', default: true },
  { key: 'aces', label: 'Aces', default: true },
  { key: 'servingErrors', label: 'Serving Errors', default: false },
  { key: 'PRF', label: 'PRF', default: false },
  { key: 'plusMinus', label: 'Plus Minus', default: false },
  { key: 'totalErrors', label: 'Total Errors', default: true },
  { key: 'miscErrors', label: 'Misc Errors', default: false },
] as const

type StatKey = (typeof STAT_COLUMNS)[number]['key']

const DEFAULT_VISIBLE: Record<string, boolean> = Object.fromEntries(
  STAT_COLUMNS.map((column) => [column.key, column.default]),
)

const PERCENT_STATS = new Set<string>(
  STAT_COLUMNS.filter((column) => 'percent' in column && column.percent).map((c) => c.key),
)

const STAT_TYPE_OPTIONS = [
  { value: 'total', label: 'Totals' },
  { value: 'perGame', label: 'Per Game' },
  { value: 'perSet', label: 'Per Set' },
]

const VIEW_OPTIONS = [
  { value: 'player', label: 'Players' },
  { value: 'team', label: 'Teams' },
]

const STAGE_ROUND_OPTIONS = [
  { value: 'all', label: 'All Rounds' },
  { value: 'R1', label: 'R1 — Winners Round of 16' },
  { value: 'R2', label: 'R2 — Winners QF + Losers R1' },
  { value: 'R3', label: 'R3 — Winners SF + Losers R2' },
  { value: 'R4', label: 'R4 — Winners Finals + Losers R3/QF' },
  { value: 'R5', label: 'R5 — Losers SF + Losers Finals' },
  { value: 'R6', label: 'R6 — Grand Finals' },
]

const OPERATOR_OPTIONS = [
  { value: '==', label: '=' },
  { value: '!=', label: '≠' },
  { value: '>', label: '>' },
  { value: '>=', label: '≥' },
  { value: '<', label: '<' },
  { value: '<=', label: '≤' },
]

const SEASON_OPTIONS = Array.from({ length: SEASON_COUNT }, (_, index) => ({
  value: String(index + 1),
  label: `Season ${index + 1}`,
}))

const STAT_TYPE_SUFFIX: Record<StatType, string> = {
  total: '',
  perGame: ' (Per Game)',
  perSet: ' (Per Set)',
}

interface FilterCondition {
  id: string
  stat: StatKey
  operator: ComparisonOperator
  value: number
}

/** One row from GET /api/stats/leaderboard. */
interface LeaderboardRow {
  id: number
  name: string
  logoUrl?: string | null
  seasonNumber?: number | null
  gamesPlayed?: number
  totalSets?: number
  [stat: string]: string | number | null | undefined
}

/** Percentages arrive as 0–1 and display as a percentage; other values keep two decimals. */
function formatStatValue(stat: string, value: number): string {
  if (PERCENT_STATS.has(stat)) return `${(value * 100).toFixed(2)}%`
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(2)
}

interface AdvancedFilterProps {
  conditions: FilterCondition[]
  onChange: (conditions: FilterCondition[]) => void
}

/** The numeric-condition builder — "total kills ≥ 100" and so on, ANDed together server-side. */
function AdvancedFilter({ conditions, onChange }: AdvancedFilterProps) {
  const update = (id: string, updates: Partial<FilterCondition>) =>
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)))

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Advanced Filters"
          level={3}
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onChange([
                  ...conditions,
                  {
                    id: Date.now().toString(),
                    stat: 'totalKills',
                    operator: '>',
                    value: 0,
                  },
                ])
              }
            >
              + Add Filter
            </Button>
          }
        />

        {conditions.length === 0 ? (
          <p className="m-0 text-sm text-content-muted">
            No filters applied. Use &ldquo;Add Filter&rdquo; to create conditions.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {conditions.map((condition) => {
              const isPercent = PERCENT_STATS.has(condition.stat)
              return (
                <div
                  key={condition.id}
                  className="grid gap-2 sm:grid-cols-[2fr_auto_1fr_auto] sm:items-center"
                >
                  <Select
                    size="sm"
                    aria-label="Statistic"
                    value={condition.stat}
                    onChange={(e) => update(condition.id, { stat: e.target.value as StatKey })}
                    options={STAT_COLUMNS.map((column) => ({
                      value: column.key,
                      label: column.label,
                    }))}
                  />
                  <Select
                    size="sm"
                    aria-label="Comparison"
                    value={condition.operator}
                    onChange={(e) =>
                      update(condition.id, {
                        operator: e.target.value as ComparisonOperator,
                      })
                    }
                    options={OPERATOR_OPTIONS}
                    className="w-auto min-w-20"
                  />
                  <div className="flex items-center gap-1">
                    <TextInput
                      size="sm"
                      type="number"
                      aria-label="Value"
                      min={0}
                      max={isPercent ? 100 : undefined}
                      value={
                        isPercent
                          ? Math.round(condition.value * 100 * 100) / 100
                          : condition.value
                      }
                      onChange={(e) => {
                        const input = Number.parseFloat(e.target.value) || 0
                        update(condition.id, { value: isPercent ? input / 100 : input })
                      }}
                    />
                    {isPercent && <span className="text-sm text-content-muted">%</span>}
                  </div>
                  <IconButton
                    icon={<span aria-hidden className="text-lg leading-none">&times;</span>}
                    label="Remove filter"
                    variant="danger"
                    size="sm"
                    onClick={() => onChange(conditions.filter((c) => c.id !== condition.id))}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

export default function StatsLeaderboard() {
  const { regionQuery } = useRegion()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [selectedStageRound, setSelectedStageRound] = useState<StageRound>('all')
  const [statType, setStatType] = useState<StatType>('total')
  const [viewType, setViewType] = useState<ViewType>('player')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string>('totalKills')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [visibleStats, setVisibleStats] = useState<Record<string, boolean>>(DEFAULT_VISIBLE)
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const debouncedSearch = useDebouncedValue(searchQuery)

  const filtersParam =
    filterConditions.length > 0
      ? JSON.stringify(
          filterConditions.map(({ stat, operator, value }) => ({ stat, operator, value })),
        )
      : undefined

  const { data: rows, totalPages, loading, error } = useLeaderboard({
    page: currentPage,
    limit: ROWS_PER_PAGE,
    view: viewType,
    statType,
    season: selectedSeason ?? undefined,
    stageRound: selectedStageRound,
    search: debouncedSearch || undefined,
    sortBy: sortColumn,
    sortDir: sortDirection,
    filters: filtersParam,
    ...regionQuery,
  })

  const leaderboardRows = (rows ?? []) as LeaderboardRow[]

  /** Every filter change resets to page 1 — a narrower set may not have the current page. */
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setCurrentPage(1)
  }

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(key)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const columns: DataTableColumn<LeaderboardRow>[] = useMemo(() => {
    const base: DataTableColumn<LeaderboardRow>[] = [
      {
        key: 'rank',
        header: '#',
        width: 'w-12',
        render: (_row, index) => (currentPage - 1) * ROWS_PER_PAGE + index + 1,
      },
      {
        key: 'name',
        header: viewType === 'team' ? 'Team' : 'Player',
        onSort: () => handleSort('name'),
        sortDirection: sortColumn === 'name' ? sortDirection : null,
        render: (row) =>
          viewType === 'team' ? (
            <span className="flex min-w-0 items-center gap-2">
              {row.logoUrl && (
                <img
                  src={String(row.logoUrl)}
                  alt=""
                  loading="lazy"
                  className="h-6 w-6 shrink-0 rounded-full border border-border object-contain"
                />
              )}
              <span className="truncate font-medium text-content">
                {row.name}
                {row.seasonNumber != null ? ` (S${row.seasonNumber})` : ''}
              </span>
            </span>
          ) : (
            <Link
              to={`/players/${row.id}`}
              onClick={(event) => event.stopPropagation()}
              className="font-medium text-accent no-underline hover:underline"
            >
              {row.name}
            </Link>
          ),
      },
    ]

    for (const column of STAT_COLUMNS) {
      if (!visibleStats[column.key]) continue
      base.push({
        key: column.key,
        header: `${column.label}${STAT_TYPE_SUFFIX[statType]}`,
        align: 'right',
        onSort: () => handleSort(column.key),
        sortDirection: sortColumn === column.key ? sortDirection : null,
        render: (row) => {
          const raw = Number(row[column.key] ?? 0)
          return (
            <span className="tabular-nums">
              {formatStatValue(column.key, Number.isFinite(raw) ? raw : 0)}
            </span>
          )
        },
      })
    }

    return base
    // handleSort is stable in effect (it only reads state setters), so it is deliberately
    // not a dependency — including it would rebuild the columns on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, viewType, sortColumn, sortDirection, visibleStats, statType])

  return (
    <PageContainer>
      <PageHeader
        title="Stats Leaderboard"
        actions={
          <LinkButton to="/records" variant="secondary">
            View Stat Records
          </LinkButton>
        }
      />

      <Toolbar
        filters={
          <>
            <FilterSelect
              label="Season"
              value={selectedSeason ? String(selectedSeason) : ''}
              onChange={resetPage((value: string) =>
                setSelectedSeason(value ? Number(value) : null),
              )}
              options={SEASON_OPTIONS}
              placeholder="All Seasons"
            />
            <FilterSelect
              label="Round"
              value={selectedStageRound === 'all' ? '' : selectedStageRound}
              onChange={resetPage((value: string) =>
                setSelectedStageRound((value || 'all') as StageRound),
              )}
              options={STAGE_ROUND_OPTIONS.filter((option) => option.value !== 'all')}
              placeholder="All Rounds"
            />
            <FilterSelect
              label="Stat type"
              value={statType}
              onChange={resetPage((value: string) => setStatType(value as StatType))}
              options={STAT_TYPE_OPTIONS}
              placeholder=""
            />
            <FilterSelect
              label="View"
              value={viewType}
              onChange={resetPage((value: string) => {
                setViewType(value as ViewType)
                setExpandedRows({})
              })}
              options={VIEW_OPTIONS}
              placeholder=""
            />
            <ColumnToggleMenu
              columns={STAT_COLUMNS.map((column) => ({
                key: column.key,
                label: column.label,
              }))}
              visible={visibleStats}
              onToggle={(key) =>
                setVisibleStats((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              onToggleAll={(next) =>
                setVisibleStats(
                  Object.fromEntries(STAT_COLUMNS.map((column) => [column.key, next])),
                )
              }
            />
            <Button
              variant={showAdvancedFilter ? 'accent' : 'secondary'}
              size="sm"
              onClick={() => setShowAdvancedFilter((value) => !value)}
            >
              Advanced Filters
              {filterConditions.length > 0 && ` (${filterConditions.length})`}
            </Button>
          </>
        }
        trailing={
          <>
            <SearchBar
              value={searchQuery}
              onSearch={resetPage(setSearchQuery)}
              placeholder={viewType === 'team' ? 'Search teams…' : 'Search players…'}
              className="w-full sm:w-64"
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        }
      />

      {showAdvancedFilter && (
        <AdvancedFilter
          conditions={filterConditions}
          onChange={(conditions) => {
            setFilterConditions(conditions)
            setCurrentPage(1)
          }}
        />
      )}

      {columns.length <= 2 && !loading ? (
        <EmptyState
          label="No stat columns selected."
          description="Use “Filter Stats” to choose which statistics to show."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={leaderboardRows}
          rowKey={(row) =>
            viewType === 'team' ? `${row.id}-${row.seasonNumber ?? 'all'}` : row.id
          }
          loading={loading}
          error={error}
          density="compact"
          stickyHeader
          emptyLabel="No results match your filters."
          onRowClick={
            viewType === 'player'
              ? (row) =>
                  setExpandedRows((prev) => ({
                    ...prev,
                    [String(row.id)]: !prev[String(row.id)],
                  }))
              : undefined
          }
          expandedRow={(row) => {
            if (viewType !== 'player' || !expandedRows[String(row.id)]) return null
            return (
              <PlayerStatsVisualization playerId={row.id} selectedSeason={selectedSeason} />
            )
          }}
        />
      )}
    </PageContainer>
  )
}
