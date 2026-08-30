/**
 * GamesPage — the admin portal's game management view: a paginated table filtered by season, stage, status, phase and bracket, with every editable column inline-editable, plus create-game, Challonge bracket import, and per-game stat upload.
 * The create form's Stage options are derived from the selected Phase (`getStageOptionsForPhase`), and Bracket only appears for playoffs — so an impossible phase/stage pairing can't be submitted.
 * Lives in `components/portal/`; mounted at /portal/games.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useGames, useSkinnySeasons, useGameStages } from '@/hooks/allFetch'
import { useGameMutations } from '@/hooks/allPatch'
import { useCreateGames } from '@/hooks/allCreate'
import { useDeleteGames } from '@/hooks/allDelete'
import { useAuth } from '@/context/authContext'
import { useRegion } from '@/context/regionContext'
import { useFormRegionSeason } from '@/hooks/useFormRegionSeason'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatGameStage } from '@/utils/gameLabels'
import { getStageOptionsForPhase } from '@/constants/gameStages'
import type { Game, CreateGameInput, ChallongeImportResult } from '@/types/interfaces'
import ChallongeImport from '@/components/ChallongeImport'
import GameStatUploadModal from './GameStatUploadModal'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Toolbar from '@/components/ui/layout/Toolbar'
import ResultsCounter from '@/components/ui/layout/ResultsCounter'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import DetailStats from '@/components/ui/layout/DetailStats'
import FilterBar from '@/components/ui/filters/FilterBar'
import FilterSelect from '@/components/ui/filters/FilterSelect'
import SearchBar from '@/components/ui/filters/SearchBar'
import Pagination from '@/components/ui/navigation/Pagination'
import Button from '@/components/ui/buttons/Button'
import Modal from '@/components/ui/modals/Modal'
import ConfirmModal from '@/components/ui/modals/ConfirmModal'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import StatusBadge from '@/components/ui/badges/StatusBadge'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'
import Select, { toOptions } from '@/components/ui/inputs/Select'
import InlineEditCell from '@/components/ui/inputs/InlineEditCell'
import RegionSeasonFields from '@/components/ui/inputs/RegionSeasonFields'

const GAMES_PER_PAGE = 10

const PHASE_OPTIONS = [
  { value: 'pre_season', label: 'Pre-Season' },
  { value: 'qualifiers', label: 'Qualifiers' },
  { value: 'playoffs', label: 'Playoffs' },
]

const BRACKET_OPTIONS = [
  { value: 'winners', label: 'Winners' },
  { value: 'losers', label: 'Losers' },
]

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
]

type EditField =
  | 'name'
  | 'seasonId'
  | 'stage'
  | 'phase'
  | 'bracket'
  | 'team1Score'
  | 'team2Score'
  | 'date'
  | 'videoUrl'
  | 'status'

/** Reads a game's date as YYYY-MM-DD, falling back to today for a missing or invalid value. */
function toDateInputValue(date: Game['date'] | undefined): string {
  const parsed = date ? new Date(date) : new Date()
  const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  return safe.toISOString().split('T')[0]
}

function formatGameDate(date: Game['date'] | undefined): string {
  if (!date) return 'No Date'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? 'Invalid Date' : parsed.toLocaleDateString()
}

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [bracketFilter, setBracketFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { regionQuery } = useRegion()
  const { user } = useAuth()
  const formRegionSeason = useFormRegionSeason('id')

  const { data: games, total, totalPages, loading, error, refetch } = useGames({
    page: currentPage,
    limit: GAMES_PER_PAGE,
    search: debouncedSearch || undefined,
    seasonId: seasonFilter || undefined,
    stage: stageFilter || undefined,
    status: statusFilter || undefined,
    phase: phaseFilter || undefined,
    bracket: bracketFilter || undefined,
    ...regionQuery,
  })
  const { data: seasons, loading: seasonsLoading } = useSkinnySeasons({
    page: 1,
    limit: 100,
    ...regionQuery,
  })
  const { data: uniqueStages, loading: stagesLoading } = useGameStages({
    seasonId: seasonFilter || undefined,
    ...regionQuery,
  })

  const { patchGame } = useGameMutations()
  const { createGame, loading: creating, error: createError } = useCreateGames()
  const { deleteItem: deleteGame, loading: deleting } = useDeleteGames()

  const [localGames, setLocalGames] = useState<Game[]>([])
  const [pendingDelete, setPendingDelete] = useState<Game | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importResult, setImportResult] = useState<ChallongeImportResult | null>(null)
  const [statUploadGame, setStatUploadGame] = useState<Game | null>(null)

  const [newName, setNewName] = useState('')
  const [newStage, setNewStage] = useState('Round 1')
  const [newPhase, setNewPhase] = useState<Game['phase']>('qualifiers')
  const [newBracket, setNewBracket] = useState<Game['bracket']>(null)
  const [newStatus, setNewStatus] = useState('scheduled')
  const [newTeam1Score, setNewTeam1Score] = useState('')
  const [newTeam2Score, setNewTeam2Score] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newTeam1Name, setNewTeam1Name] = useState('')
  const [newTeam2Name, setNewTeam2Name] = useState('')
  const [formError, setFormError] = useState('')

  const canDelete = user?.role === 'superadmin'

  useEffect(() => {
    setLocalGames(games ?? [])
  }, [games])

  const seasonOptions = useMemo(
    () =>
      [...(seasons ?? [])]
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map((season) => ({ value: season.id.toString(), label: `Season ${season.seasonNumber}` })),
    [seasons]
  )

  /** Stage choices follow the selected phase — a playoff stage can't be picked for qualifiers. */
  const createStageOptions = useMemo(() => getStageOptionsForPhase(newPhase), [newPhase])

  const commitEdit = async (game: Game, field: EditField, value: string) => {
    setSaveError(null)

    const payload: Record<string, unknown> = {}
    if (field === 'seasonId') payload.seasonId = Number(value)
    else if (field === 'team1Score' || field === 'team2Score') payload[field] = Number(value)
    else if (field === 'date') payload.date = new Date(value)
    else if (field === 'videoUrl' || field === 'bracket') payload[field] = value === '' ? null : value
    else payload[field] = value

    try {
      const updated = await patchGame(game.id, payload)
      setLocalGames((prev) => prev.map((g) => (g.id === game.id ? updated : g)))
      refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update game.')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const wasDeleted = await deleteGame(pendingDelete.id.toString())
    if (wasDeleted) {
      setLocalGames((prev) => prev.filter((g) => g.id !== pendingDelete.id))
      refetch()
    }
    setPendingDelete(null)
  }

  const openModal = () => {
    setIsModalOpen(true)
    setFormError('')
    setNewName('')
    setNewPhase('qualifiers')
    setNewBracket(null)
    setNewStage('Round 1')
    setNewStatus('scheduled')
    setNewTeam1Score('')
    setNewTeam2Score('')
    setNewDate('')
    setNewVideoUrl('')
    setNewTeam1Name('')
    setNewTeam2Name('')
    formRegionSeason.initFromActiveRegion()
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    setFormError('')

    if (
      !newName ||
      formRegionSeason.seasonValue === '' ||
      !newTeam1Name ||
      !newTeam2Name ||
      !newDate ||
      !newStage
    ) {
      setFormError('Name, region, season, both team names, date and stage are required.')
      return
    }

    try {
      await createGame({
        name: newName,
        seasonId: formRegionSeason.seasonValue as number,
        teamNames: [newTeam1Name, newTeam2Name],
        team1Score: newTeam1Score === '' ? null : Number(newTeam1Score),
        team2Score: newTeam2Score === '' ? null : Number(newTeam2Score),
        videoUrl: newVideoUrl === '' ? null : newVideoUrl,
        date: new Date(newDate),
        stage: newStage,
        phase: newPhase,
        bracket: newPhase === 'playoffs' ? newBracket : null,
        status: newStatus as 'scheduled' | 'completed',
      } satisfies CreateGameInput)

      setIsModalOpen(false)
      formRegionSeason.setSeasonValue('')
      refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create game.')
    }
  }

  const columns: DataTableColumn<Game>[] = [
    {
      key: 'name',
      header: 'Game',
      render: (game) => (
        <InlineEditCell
          label="Game name"
          value={game.name ?? ''}
          display={game.name || `#${game.id}`}
          onCommit={(value) => commitEdit(game, 'name', value)}
        />
      ),
    },
    {
      key: 'phase',
      header: 'Phase',
      hideOnMobile: true,
      render: (game) => (
        <InlineEditCell
          label="Phase"
          value={game.phase ?? 'qualifiers'}
          options={PHASE_OPTIONS}
          onCommit={(value) => commitEdit(game, 'phase', value)}
        />
      ),
    },
    {
      key: 'bracket',
      header: 'Bracket',
      hideOnMobile: true,
      render: (game) => (
        <InlineEditCell
          label="Bracket"
          value={game.bracket ?? ''}
          display={game.bracket ?? '—'}
          options={[{ value: '', label: '—' }, ...BRACKET_OPTIONS]}
          onCommit={(value) => commitEdit(game, 'bracket', value)}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (game) => (
        <InlineEditCell
          label="Status"
          value={game.status}
          display={<StatusBadge status={game.status} />}
          options={STATUS_OPTIONS}
          onCommit={(value) => commitEdit(game, 'status', value)}
        />
      ),
    },
    {
      key: 'season',
      header: 'Season',
      width: 'w-24',
      hideOnMobile: true,
      render: (game) => (
        <InlineEditCell
          label="Season id"
          type="number"
          value={String(game.season.id)}
          display={game.season.seasonNumber}
          onCommit={(value) => commitEdit(game, 'seasonId', value)}
        />
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (game) => (
        <InlineEditCell
          label="Stage"
          value={game.stage}
          display={formatGameStage(game)}
          onCommit={(value) => commitEdit(game, 'stage', value)}
        />
      ),
    },
    {
      key: 'stats',
      header: 'Stats',
      align: 'center',
      width: 'w-16',
      render: (game) =>
        game.stats?.length ? (
          <span className="text-status-success">✓</span>
        ) : (
          <span className="text-content-muted">—</span>
        ),
    },
    { key: 'team1', header: 'Team 1', hideOnMobile: true, render: (game) => game.teams?.[0]?.name || 'N/A' },
    { key: 'team2', header: 'Team 2', hideOnMobile: true, render: (game) => game.teams?.[1]?.name || 'N/A' },
    {
      key: 'team1Score',
      header: 'T1',
      align: 'center',
      width: 'w-16',
      render: (game) => (
        <InlineEditCell
          label="Team 1 score"
          type="number"
          value={String(game.team1Score ?? '')}
          onCommit={(value) => commitEdit(game, 'team1Score', value)}
        />
      ),
    },
    {
      key: 'team2Score',
      header: 'T2',
      align: 'center',
      width: 'w-16',
      render: (game) => (
        <InlineEditCell
          label="Team 2 score"
          type="number"
          value={String(game.team2Score ?? '')}
          onCommit={(value) => commitEdit(game, 'team2Score', value)}
        />
      ),
    },
    {
      key: 'date',
      header: 'Date',
      hideOnMobile: true,
      render: (game) => (
        <InlineEditCell
          label="Game date"
          type="date"
          value={toDateInputValue(game.date)}
          display={formatGameDate(game.date)}
          onCommit={(value) => commitEdit(game, 'date', value)}
        />
      ),
    },
    {
      key: 'videoUrl',
      header: 'Video',
      hideOnMobile: true,
      render: (game) => (
        <InlineEditCell
          label="Video URL"
          type="url"
          value={game.videoUrl || ''}
          display={game.videoUrl || 'N/A'}
          onCommit={(value) => commitEdit(game, 'videoUrl', value)}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 'w-48',
      render: (game) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="xs" onClick={() => setStatUploadGame(game)}>
            Upload Stats
          </Button>
          {canDelete && (
            <Button
              variant="danger"
              size="xs"
              disabled={deleting}
              onClick={() => setPendingDelete(game)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ]

  const activeFilterCount = [
    searchQuery,
    seasonFilter,
    stageFilter,
    statusFilter,
    phaseFilter,
    bracketFilter,
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearchQuery('')
    setSeasonFilter('')
    setStageFilter('')
    setStatusFilter('')
    setPhaseFilter('')
    setBracketFilter('')
    setCurrentPage(1)
  }

  /** Every filter resets to page 1 — otherwise a narrower result set lands on an empty page. */
  const setFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Games"
        actions={
          <>
            <Button onClick={openModal}>Create Game</Button>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
              Import from Challonge
            </Button>
          </>
        }
      />

      <Toolbar
        filters={
          <FilterBar onReset={clearFilters} activeCount={activeFilterCount}>
            <FilterSelect
              label="Season"
              value={seasonFilter}
              onChange={setFilter(setSeasonFilter)}
              options={seasonOptions}
              placeholder={seasonsLoading ? 'Loading seasons…' : 'All Seasons'}
            />
            <FilterSelect
              label="Stage"
              value={stageFilter}
              onChange={setFilter(setStageFilter)}
              options={toOptions(uniqueStages ?? [])}
              placeholder={stagesLoading ? 'Loading stages…' : 'All Stages'}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setFilter(setStatusFilter)}
              options={STATUS_OPTIONS}
              placeholder="All Statuses"
            />
            <FilterSelect
              label="Phase"
              value={phaseFilter}
              onChange={setFilter(setPhaseFilter)}
              options={PHASE_OPTIONS}
              placeholder="All Phases"
            />
            <FilterSelect
              label="Bracket"
              value={bracketFilter}
              onChange={setFilter(setBracketFilter)}
              options={BRACKET_OPTIONS}
              placeholder="All Brackets"
            />
          </FilterBar>
        }
        trailing={
          <>
            <SearchBar
              value={searchQuery}
              onSearch={setFilter(setSearchQuery)}
              placeholder="Search games…"
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

      <ResultsCounter page={currentPage} pageSize={GAMES_PER_PAGE} total={total} noun="games" />

      {saveError && <ErrorNotice message={saveError} />}

      <DataTable
        columns={columns}
        rows={localGames}
        rowKey={(game) => game.id}
        loading={loading}
        error={error}
        density="compact"
        emptyLabel="No games match your filters."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Game"
        size="md"
        footer={
          <Button type="submit" form="create-game-form" loading={creating} loadingLabel="Creating…">
            Submit
          </Button>
        }
      >
        <form id="create-game-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          {formError && <ErrorNotice message={formError} />}
          {createError && <ErrorNotice message={createError} />}

          <FormField label="Name" required>
            {(id) => (
              <TextInput
                id={id}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            )}
          </FormField>

          <RegionSeasonFields
            regions={formRegionSeason.regions}
            regionsLoading={formRegionSeason.regionsLoading}
            regionId={formRegionSeason.regionId}
            onRegionChange={formRegionSeason.setRegionId}
            seasons={formRegionSeason.seasons}
            seasonsLoading={formRegionSeason.seasonsLoading}
            seasonValue={formRegionSeason.seasonValue}
            onSeasonChange={formRegionSeason.setSeasonValue}
            seasonValueKey="id"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Status">
              {(id) => (
                <Select
                  id={id}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  options={STATUS_OPTIONS}
                />
              )}
            </FormField>

            <FormField label="Phase">
              {(id) => (
                <Select
                  id={id}
                  value={newPhase ?? 'qualifiers'}
                  options={PHASE_OPTIONS}
                  onChange={(e) => {
                    const phase = e.target.value as Game['phase']
                    setNewPhase(phase)
                    if (phase !== 'playoffs') setNewBracket(null)
                    // Keep the stage valid for the new phase.
                    const options = getStageOptionsForPhase(phase)
                    setNewStage((current) =>
                      options.includes(current) ? current : (options[0] ?? '')
                    )
                  }}
                />
              )}
            </FormField>

            {newPhase === 'playoffs' && (
              <FormField label="Bracket" hint="Leave on Auto to derive it from the stage.">
                {(id) => (
                  <Select
                    id={id}
                    value={newBracket ?? ''}
                    placeholder="Auto (from stage)"
                    options={BRACKET_OPTIONS}
                    onChange={(e) =>
                      setNewBracket(
                        e.target.value === '' ? null : (e.target.value as Game['bracket'])
                      )
                    }
                  />
                )}
              </FormField>
            )}

            <FormField label="Stage" required>
              {(id) => (
                <Select
                  id={id}
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  options={toOptions(createStageOptions)}
                  placeholder="Select a stage"
                  required
                />
              )}
            </FormField>

            <FormField label="Team 1 Name" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={newTeam1Name}
                  onChange={(e) => setNewTeam1Name(e.target.value)}
                  required
                />
              )}
            </FormField>

            <FormField label="Team 1 Score">
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  value={newTeam1Score}
                  onChange={(e) => setNewTeam1Score(e.target.value)}
                />
              )}
            </FormField>

            <FormField label="Team 2 Name" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={newTeam2Name}
                  onChange={(e) => setNewTeam2Name(e.target.value)}
                  required
                />
              )}
            </FormField>

            <FormField label="Team 2 Score">
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  value={newTeam2Score}
                  onChange={(e) => setNewTeam2Score(e.target.value)}
                />
              )}
            </FormField>

            <FormField label="Date" required>
              {(id) => (
                <TextInput
                  id={id}
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              )}
            </FormField>

            <FormField label="Video URL">
              {(id) => (
                <TextInput
                  id={id}
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                />
              )}
            </FormField>
          </div>
        </form>
      </Modal>

      {isImportModalOpen && (
        <ChallongeImport
          onImportSuccess={(result) => {
            setIsImportModalOpen(false)
            setImportResult(result)
            refetch()
          }}
          onCancel={() => setIsImportModalOpen(false)}
        />
      )}

      <Modal
        isOpen={Boolean(importResult)}
        onClose={() => setImportResult(null)}
        title="Challonge Import Results"
        size="sm"
      >
        {importResult && (
          <DetailStats
            columns={3}
            items={[
              { label: 'Created', value: importResult.summary.created },
              { label: 'Updated', value: importResult.summary.updated },
              { label: 'Skipped', value: importResult.summary.skipped },
            ]}
          />
        )}
      </Modal>

      <GameStatUploadModal
        game={statUploadGame}
        isOpen={Boolean(statUploadGame)}
        onClose={() => setStatUploadGame(null)}
        onSuccess={refetch}
      />

      <ConfirmModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete game"
        confirmLabel="Delete"
        message={
          <>
            Delete <strong>{pendingDelete?.name || `game #${pendingDelete?.id}`}</strong>? This also
            removes its recorded stats and cannot be undone.
          </>
        }
      />
    </PageContainer>
  )
}
