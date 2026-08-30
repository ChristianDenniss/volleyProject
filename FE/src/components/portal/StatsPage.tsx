/**
 * StatsPage — the admin portal's stat-line management view: a dense, inline-editable table of every recorded stat line, plus a create-stat form and a CSV importer that can either create a new game from the file or append its rows to an existing game.
 * The thirteen stat columns are generated from the `STAT_FIELDS` array rather than written out thirteen times, so adding a tracked statistic is one entry that flows through the table, the create form and the CSV preview together.
 * Lives in `components/portal/`; mounted at /portal/stats.
 */
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useStats, usePlayers, useSkinnyGames } from '@/hooks/allFetch'
import { useStatsMutations } from '@/hooks/allPatch'
import { useCreateStats, useCSVUpload, useAddStatsToExistingGame } from '@/hooks/allCreate'
import { useDeleteStats } from '@/hooks/allDelete'
import { useAuth } from '@/context/authContext'
import { useRegion } from '@/context/regionContext'
import { useFormRegionSeason } from '@/hooks/useFormRegionSeason'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { handleFileUpload } from '@/utils/csvUploadUtils'
import type { Stats } from '@/types/interfaces'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Toolbar from '@/components/ui/layout/Toolbar'
import ResultsCounter from '@/components/ui/layout/ResultsCounter'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import DetailStats from '@/components/ui/layout/DetailStats'
import Card from '@/components/ui/layout/Card'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import SearchBar from '@/components/ui/filters/SearchBar'
import Pagination from '@/components/ui/navigation/Pagination'
import Button from '@/components/ui/buttons/Button'
import Modal from '@/components/ui/modals/Modal'
import ConfirmModal from '@/components/ui/modals/ConfirmModal'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'
import Select, { toOptions } from '@/components/ui/inputs/Select'
import { Radio } from '@/components/ui/inputs/Checkbox'
import InlineEditCell from '@/components/ui/inputs/InlineEditCell'
import RegionSeasonFields from '@/components/ui/inputs/RegionSeasonFields'

const STATS_PER_PAGE = 10

/** Stage choices offered when the CSV importer creates a game. */
const STAGE_OPTIONS = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4',
  'Round 5',
  'Round 6',
  'Round of 16',
  'Quarterfinals',
  'Semifinals',
  'Finals',
  'Grand Finals',
  'Bracket Reset',
  '3rd Place Match',
]

/** The numeric statistics tracked per player, per game.
 *  This one array drives the table columns, the create form and the CSV preview. */
const STAT_FIELDS = [
  { key: 'spikingErrors', label: 'Spiking Errors', short: 'Sp Err' },
  { key: 'apeKills', label: 'Ape Kills', short: 'Ape K' },
  { key: 'apeAttempts', label: 'Ape Attempts', short: 'Ape A' },
  { key: 'spikeKills', label: 'Spike Kills', short: 'Sp K' },
  { key: 'spikeAttempts', label: 'Spike Attempts', short: 'Sp A' },
  { key: 'assists', label: 'Assists', short: 'Ast' },
  { key: 'settingErrors', label: 'Setting Errors', short: 'Set Err' },
  { key: 'blocks', label: 'Blocks', short: 'Blk' },
  { key: 'digs', label: 'Digs', short: 'Dig' },
  { key: 'blockFollows', label: 'Block Follows', short: 'Blk F' },
  { key: 'aces', label: 'Aces', short: 'Ace' },
  { key: 'servingErrors', label: 'Serving Errors', short: 'Srv Err' },
  { key: 'miscErrors', label: 'Misc Errors', short: 'Misc' },
] as const

type StatFieldKey = (typeof STAT_FIELDS)[number]['key']
type EditField = StatFieldKey | 'playerId' | 'gameId'

/** Zeroed counts, used to reset the create form. */
const EMPTY_COUNTS: Record<StatFieldKey, number> = Object.fromEntries(
  STAT_FIELDS.map((field) => [field.key, 0])
) as Record<StatFieldKey, number>

/** CSV preview payload shape produced by `utils/csvUploadUtils`. */
interface CsvPreview {
  gameData: {
    seasonId: number
    teamNames: string[]
    team1Score?: number
    team2Score?: number
  }
  teamNames: string[]
  seasonId: number
  statsData: (Record<StatFieldKey, number> & { playerName: string })[]
}

type UploadMode = 'create' | 'add'

/** Normalises any thrown value — string, Error, axios-style response — to a message. */
function toUploadErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const candidate = err as {
      message?: string
      error?: string
      response?: { data?: { error?: string; message?: string } }
    }
    return (
      candidate.message ??
      candidate.error ??
      candidate.response?.data?.error ??
      candidate.response?.data?.message ??
      'Unknown error occurred'
    )
  }
  return 'Unknown error occurred'
}

export default function StatsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { regionQuery } = useRegion()
  const { user } = useAuth()
  const formRegionSeason = useFormRegionSeason('id')

  const { data: stats, total, totalPages, loading, error, refetch } = useStats({
    page: currentPage,
    limit: STATS_PER_PAGE,
    search: debouncedSearch || undefined,
    ...regionQuery,
  })
  const { data: players, loading: playersLoading } = usePlayers({
    page: 1,
    limit: 100,
    ...regionQuery,
  })
  const { data: gamesForSeason, loading: gamesLoading } = useSkinnyGames({
    page: 1,
    limit: 200,
    seasonId: formRegionSeason.seasonValue || undefined,
    ...regionQuery,
  })

  const { patchStats } = useStatsMutations()
  const { createStats, loading: creating, error: createError } = useCreateStats()
  const { deleteItem: deleteStat, loading: deleting, error: deleteError } = useDeleteStats()

  const [uploadError, setUploadError] = useState<string | null>(null)
  const showErrorModal = (err: unknown) => setUploadError(toUploadErrorMessage(err))

  const { uploadCSV, loading: csvUploadLoading, error: csvUploadError } = useCSVUpload(showErrorModal)
  const {
    addStatsToGame,
    loading: addStatsLoading,
    error: addStatsError,
  } = useAddStatsToExistingGame(showErrorModal)

  const [localStats, setLocalStats] = useState<Stats[]>([])
  const [pendingDelete, setPendingDelete] = useState<Stats | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  /* Create-stat modal */
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [counts, setCounts] = useState<Record<StatFieldKey, number>>(EMPTY_COUNTS)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newGameId, setNewGameId] = useState(0)
  const [formError, setFormError] = useState('')

  /* CSV importer */
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null)
  const [csvParseError, setCsvParseError] = useState('')
  const [uploadMode, setUploadMode] = useState<UploadMode>('create')
  const [existingGameId, setExistingGameId] = useState('')
  const [isStageModalOpen, setIsStageModalOpen] = useState(false)
  const [stageInput, setStageInput] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const canDelete = user?.role === 'superadmin'
  const uploadBusy = csvUploadLoading || addStatsLoading

  useEffect(() => {
    setLocalStats(stats ?? [])
  }, [stats])

  const playerOptions = useMemo(
    () => (players ?? []).map((player) => ({ value: player.name, label: player.name })),
    [players]
  )

  const gameOptions = useMemo(
    () =>
      (gamesForSeason ?? []).map((game) => ({
        value: String(game.id),
        label: `#${game.id} — ${game.name || `${game.teams?.[0]?.name ?? 'TBD'} vs ${game.teams?.[1]?.name ?? 'TBD'}`}`,
      })),
    [gamesForSeason]
  )

  /** Says why the game list is empty rather than offering an empty "Select a game". */
  const gamePlaceholder = !formRegionSeason.seasonValue
    ? 'Select a season first'
    : gamesLoading
      ? 'Loading games…'
      : gameOptions.length === 0
        ? 'No games in this season'
        : 'Select a game'

  const commitEdit = async (row: Stats, field: EditField, value: string) => {
    setSaveError(null)
    const payload: Record<string, number> = { [field]: Number(value) }

    try {
      const updated = await patchStats(row.id, payload)
      setLocalStats((prev) => prev.map((s) => (s.id === row.id ? { ...s, ...updated } : s)))
      refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const wasDeleted = await deleteStat(pendingDelete.id.toString())
    if (wasDeleted) {
      setLocalStats((prev) => prev.filter((s) => s.id !== pendingDelete.id))
      refetch()
    }
    setPendingDelete(null)
  }

  const openCreateModal = () => {
    setIsModalOpen(true)
    setFormError('')
    setCounts(EMPTY_COUNTS)
    setNewPlayerName('')
    setNewGameId(0)
    formRegionSeason.initFromActiveRegion()
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()

    if (
      !newPlayerName ||
      newGameId <= 0 ||
      !formRegionSeason.regionId ||
      formRegionSeason.seasonValue === ''
    ) {
      setFormError('Region, season, player, and game are required.')
      return
    }

    const created = await createStats({
      ...counts,
      playerName: newPlayerName,
      gameId: newGameId,
    })

    if (created) {
      setLocalStats((prev) => [created, ...prev])
      refetch()
      setIsModalOpen(false)
    }
  }

  const closeCSVModal = () => {
    setIsCSVModalOpen(false)
    setCsvPreview(null)
    setCsvParseError('')
    setUploadError(null)
  }

  const onFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(
      event,
      () => {},
      () => {},
      setCsvPreview,
      setCsvParseError,
      showErrorModal
    )
  }

  /** Runs the import: either create a game from the CSV, or append its rows to an existing one. */
  const submitImport = async () => {
    if (!csvPreview) return

    if (uploadMode === 'create') {
      if (!stageInput.trim()) return
      if (!formRegionSeason.regionId || formRegionSeason.seasonValue === '') {
        showErrorModal({ message: 'Please select a region and season.' })
        return
      }

      const gameData = {
        ...csvPreview.gameData,
        seasonId: formRegionSeason.seasonValue as number,
        stage: stageInput.trim(),
        name: `${csvPreview.teamNames[0]} vs. ${csvPreview.teamNames[1]} S${csvPreview.seasonId}`,
        team1Score: csvPreview.gameData.team1Score || 0,
        team2Score: csvPreview.gameData.team2Score || 0,
        videoUrl: '',
        date: new Date().toISOString(),
      }

      try {
        const result = await uploadCSV({ gameData, statsData: csvPreview.statsData })
        if (!result) return // the hook already surfaced the error

        setLocalStats((prev) => [...result.stats, ...prev])
        refetch()
        setIsStageModalOpen(false)
        setStageInput('')
        closeCSVModal()
        setSuccessMessage(`Uploaded the game and ${result.stats.length} stat records.`)
      } catch (err) {
        showErrorModal(err)
        setIsStageModalOpen(false)
        setStageInput('')
      }
      return
    }

    const gameId = Number(existingGameId)
    if (!existingGameId || Number.isNaN(gameId) || gameId < 1) {
      showErrorModal({ message: 'Please enter a valid Game ID (a positive number).' })
      return
    }

    try {
      const result = await addStatsToGame(gameId, csvPreview.statsData)
      if (!result) return

      setLocalStats((prev) => [...result, ...prev])
      refetch()
      setIsStageModalOpen(false)
      setExistingGameId('')
      closeCSVModal()
      setSuccessMessage(`Added ${result.length} stat records to game ${gameId}.`)
    } catch (err) {
      showErrorModal(err)
      setIsStageModalOpen(false)
      setExistingGameId('')
    }
  }

  const columns: DataTableColumn<Stats>[] = [
    { key: 'id', header: 'ID', width: 'w-14', render: (row) => row.id },
    {
      key: 'gameId',
      header: 'Game',
      width: 'w-20',
      render: (row) => (
        <InlineEditCell
          label="Game id"
          type="number"
          value={row.game.id.toString()}
          onCommit={(value) => commitEdit(row, 'gameId', value)}
        />
      ),
    },
    {
      key: 'playerId',
      header: 'Player',
      width: 'w-20',
      render: (row) => (
        <InlineEditCell
          label="Player id"
          type="number"
          value={row.player.id.toString()}
          onCommit={(value) => commitEdit(row, 'playerId', value)}
        />
      ),
    },
    ...STAT_FIELDS.map<DataTableColumn<Stats>>((field) => ({
      key: field.key,
      header: field.short,
      align: 'center',
      render: (row) => (
        <InlineEditCell
          label={field.label}
          type="number"
          value={String(row[field.key])}
          className="text-center"
          onCommit={(value) => commitEdit(row, field.key, value)}
        />
      ),
    })),
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 'w-24',
      render: (row) =>
        canDelete ? (
          <Button
            variant="danger"
            size="xs"
            disabled={deleting}
            onClick={() => setPendingDelete(row)}
          >
            Delete
          </Button>
        ) : (
          <span className="text-xs text-content-muted">No permission</span>
        ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Stats"
        subtitle="Every recorded stat line. Click any number to edit it in place."
        actions={
          <>
            <Button onClick={openCreateModal}>Create Stat</Button>
            <Button variant="secondary" onClick={() => setIsCSVModalOpen(true)}>
              Upload CSV
            </Button>
          </>
        }
      />

      <Toolbar
        trailing={
          <>
            <SearchBar
              value={searchQuery}
              onSearch={(query) => {
                setSearchQuery(query)
                setCurrentPage(1)
              }}
              placeholder="Search stats…"
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

      <ResultsCounter page={currentPage} pageSize={STATS_PER_PAGE} total={total} noun="stats" />

      {successMessage && (
        <ErrorNotice
          message={successMessage}
          tone="info"
          action={
            <Button variant="ghost" size="xs" onClick={() => setSuccessMessage(null)}>
              Dismiss
            </Button>
          }
        />
      )}
      {saveError && <ErrorNotice message={saveError} />}
      {deleteError && <ErrorNotice message={deleteError} />}

      <DataTable
        columns={columns}
        rows={localStats}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        density="compact"
        emptyLabel="No stats found."
      />

      {/* ── Create stat ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Stat"
        size="lg"
        footer={
          <Button type="submit" form="create-stat-form" loading={creating} loadingLabel="Creating…">
            Submit
          </Button>
        }
      >
        <form id="create-stat-form" onSubmit={handleCreate} className="flex flex-col gap-5">
          {formError && <ErrorNotice message={formError} />}
          {createError && <ErrorNotice message={createError} />}

          <RegionSeasonFields
            regions={formRegionSeason.regions}
            regionsLoading={formRegionSeason.regionsLoading}
            regionId={formRegionSeason.regionId}
            onRegionChange={(id) => {
              formRegionSeason.setRegionId(id)
              setNewGameId(0)
            }}
            seasons={formRegionSeason.seasons}
            seasonsLoading={formRegionSeason.seasonsLoading}
            seasonValue={formRegionSeason.seasonValue}
            onSeasonChange={(id) => {
              formRegionSeason.setSeasonValue(id)
              setNewGameId(0)
            }}
            seasonValueKey="id"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Player" required>
              {(id) => (
                <Select
                  id={id}
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  options={playerOptions}
                  placeholder={playersLoading ? 'Loading players…' : 'Select a player'}
                  required
                />
              )}
            </FormField>

            <FormField label="Game" required>
              {(id) => (
                <Select
                  id={id}
                  value={newGameId ? String(newGameId) : ''}
                  onChange={(e) => setNewGameId(Number(e.target.value))}
                  options={gameOptions}
                  placeholder={gamePlaceholder}
                  disabled={!formRegionSeason.seasonValue}
                  required
                />
              )}
            </FormField>
          </div>

          <div className="flex flex-col gap-3">
            <SectionHeader title="Counts" level={4} />
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {STAT_FIELDS.map((field) => (
                <FormField key={field.key} label={field.label}>
                  {(id) => (
                    <TextInput
                      id={id}
                      type="number"
                      min={0}
                      size="sm"
                      value={counts[field.key]}
                      onChange={(e) =>
                        setCounts((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))
                      }
                    />
                  )}
                </FormField>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ── CSV import ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isCSVModalOpen}
        onClose={closeCSVModal}
        title="Upload CSV"
        size="lg"
        dismissOnBackdrop={!uploadBusy}
        footer={
          <>
            <Button variant="outline" onClick={closeCSVModal} disabled={uploadBusy}>
              Cancel
            </Button>
            {csvPreview && (
              <Button
                loading={uploadBusy}
                loadingLabel="Processing…"
                disabled={uploadMode === 'add' && !existingGameId}
                onClick={() => {
                  if (uploadMode === 'create') {
                    formRegionSeason.initFromActiveRegion()
                    setIsStageModalOpen(true)
                  } else {
                    void submitImport()
                  }
                }}
              >
                {uploadMode === 'create' ? 'Create Game' : 'Add Stats'}
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {csvParseError && <ErrorNotice message={csvParseError} />}
          {csvUploadError && <ErrorNotice message={`CSV Upload Error: ${csvUploadError}`} />}
          {addStatsError && <ErrorNotice message={`Add Stats Error: ${addStatsError}`} />}

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-1 text-sm font-medium text-content-secondary">Upload mode</legend>
            <div className="flex flex-wrap gap-6">
              <Radio
                name="uploadMode"
                value="create"
                checked={uploadMode === 'create'}
                onChange={() => setUploadMode('create')}
                label="Create New Game + Stats"
              />
              <Radio
                name="uploadMode"
                value="add"
                checked={uploadMode === 'add'}
                onChange={() => setUploadMode('add')}
                label="Add Stats to Existing Game"
              />
            </div>
          </fieldset>

          {uploadMode === 'add' && (
            <FormField label="Existing Game ID" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={existingGameId}
                  onChange={(e) => setExistingGameId(e.target.value)}
                  placeholder="Enter game ID"
                />
              )}
            </FormField>
          )}

          <FormField label="Select CSV File">
            {(id) => (
              <input
                id={id}
                type="file"
                accept=".csv"
                onChange={onFileSelected}
                className="w-full cursor-pointer rounded-control border border-border bg-surface p-2 text-sm text-content-secondary file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-on-brand"
              />
            )}
          </FormField>

          {csvPreview && (
            <Card tone="inset" padding="md">
              <div className="flex flex-col gap-4">
                <SectionHeader
                  title={
                    uploadMode === 'create'
                      ? 'Game Data'
                      : `Adding to Game ID: ${existingGameId || '—'}`
                  }
                  level={4}
                />

                <DetailStats
                  columns={3}
                  items={
                    uploadMode === 'create'
                      ? [
                          { label: 'Date', value: new Date().toLocaleDateString() },
                          { label: 'Season ID', value: csvPreview.gameData.seasonId },
                          { label: 'Teams', value: csvPreview.gameData.teamNames.join(' vs ') },
                          { label: 'Team 1 Score', value: csvPreview.gameData.team1Score ?? 0 },
                          { label: 'Team 2 Score', value: csvPreview.gameData.team2Score ?? 0 },
                        ]
                      : [
                          { label: 'Season ID', value: csvPreview.gameData.seasonId },
                          { label: 'Teams', value: csvPreview.gameData.teamNames.join(' vs ') },
                        ]
                  }
                />

                <SectionHeader
                  title="Stats Data"
                  count={csvPreview.statsData.length}
                  level={4}
                />
                <div className="scrollbar-thin flex max-h-72 flex-col gap-2 overflow-y-auto">
                  {csvPreview.statsData.map((row, index) => (
                    <div
                      key={index}
                      className="rounded-control border border-border bg-surface px-3 py-2 text-xs"
                    >
                      <strong className="text-content">{row.playerName}</strong>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-content-tertiary">
                        {STAT_FIELDS.map((field) => (
                          <span key={field.key}>
                            {field.short}: <span className="tabular-nums">{row[field.key]}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </Modal>

      {/* ── Region / season / stage, for the create-a-game import path ──────── */}
      <Modal
        isOpen={isStageModalOpen && uploadMode === 'create'}
        onClose={() => {
          setIsStageModalOpen(false)
          setStageInput('')
        }}
        title="Region, Season & Stage"
        size="sm"
        dismissOnBackdrop={!csvUploadLoading}
        footer={
          <>
            <Button
              variant="outline"
              disabled={csvUploadLoading}
              onClick={() => {
                setIsStageModalOpen(false)
                setStageInput('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitImport()}
              loading={csvUploadLoading}
              loadingLabel="Creating…"
              disabled={!stageInput.trim()}
            >
              Submit
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
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

          <FormField label="Stage" required>
            {(id) => (
              <Select
                id={id}
                value={stageInput}
                onChange={(e) => setStageInput(e.target.value)}
                options={toOptions(STAGE_OPTIONS)}
                placeholder="Select a stage"
                required
              />
            )}
          </FormField>
        </div>
      </Modal>

      {/* ── Upload failure ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={uploadError !== null}
        onClose={() => setUploadError(null)}
        title="Upload Failed"
        size="sm"
        footer={
          <Button onClick={() => setUploadError(null)}>Close</Button>
        }
      >
        <ErrorNotice message={uploadError ?? ''} />
      </Modal>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete stat record"
        confirmLabel="Delete"
        message={
          <>
            Delete the stat record for{' '}
            <strong>{pendingDelete?.player?.name ?? 'this player'}</strong> in game{' '}
            <strong>#{pendingDelete?.game?.id}</strong>? This cannot be undone.
          </>
        }
      />
    </PageContainer>
  )
}
