/**
 * PlayersPage — the admin portal's player management view: a paginated table with inline name/position editing, a superadmin-only delete action, and a batch-create modal for adding several players at once.
 * Inline edits go through `InlineEditCell` and confirm before PATCHing; deletion confirms through `ConfirmModal` rather than `window.confirm`, so the whole page shares the app's dialog styling.
 * Lives in `components/portal/`; mounted at /portal/players.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { usePlayers } from '@/hooks/allFetch'
import { usePlayerMutations } from '@/hooks/allPatch'
import { useBatchPlayersByTeamName } from '@/hooks/useCreatePlayers'
import { useDeletePlayers } from '@/hooks/allDelete'
import { useAuth } from '@/context/authContext'
import { useRegion } from '@/context/regionContext'
import { useFormRegionSeason } from '@/hooks/useFormRegionSeason'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Player } from '@/types/interfaces'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Toolbar from '@/components/ui/layout/Toolbar'
import ResultsCounter from '@/components/ui/layout/ResultsCounter'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import SearchBar from '@/components/ui/filters/SearchBar'
import Pagination from '@/components/ui/navigation/Pagination'
import Button from '@/components/ui/buttons/Button'
import Modal from '@/components/ui/modals/Modal'
import ConfirmModal from '@/components/ui/modals/ConfirmModal'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import TextInput from '@/components/ui/inputs/TextInput'
import InlineEditCell from '@/components/ui/inputs/InlineEditCell'
import RegionSeasonFields from '@/components/ui/inputs/RegionSeasonFields'
import OverflowListCell from '@/components/ui/misc/OverflowListCell'

const PLAYERS_PER_PAGE = 10

interface BatchFormRow {
  name: string
  position: string
  /** Comma-separated team names; normalised to lowercase on submit. */
  teamNamesCSV: string
}

const EMPTY_ROW: BatchFormRow = { name: '', position: '', teamNamesCSV: '' }

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { regionQuery } = useRegion()
  const { user } = useAuth()
  const formRegionSeason = useFormRegionSeason('id')

  const { data: players, total, totalPages, loading, error, refetch } = usePlayers({
    page: currentPage,
    limit: PLAYERS_PER_PAGE,
    search: debouncedSearch || undefined,
    ...regionQuery,
  })

  const { patchPlayer } = usePlayerMutations()
  const { createBatch, loading: batchLoading, error: batchError } = useBatchPlayersByTeamName()
  const { deleteItem: deletePlayer, loading: deleting, error: deleteError } = useDeletePlayers()

  const [localPlayers, setLocalPlayers] = useState<Player[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [batchRows, setBatchRows] = useState<BatchFormRow[]>([EMPTY_ROW])
  const [formError, setFormError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Player | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const canDelete = user?.role === 'superadmin'

  useEffect(() => {
    setLocalPlayers(players ?? [])
  }, [players])

  const commitEdit = async (player: Player, field: 'name' | 'position', value: string) => {
    setSaveError(null)
    try {
      const updated = await patchPlayer(player.id, { [field]: value } as Partial<Player>)
      setLocalPlayers((prev) => prev.map((p) => (p.id === player.id ? { ...p, ...updated } : p)))
      refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const wasDeleted = await deletePlayer(pendingDelete.id.toString())
    if (wasDeleted) {
      setLocalPlayers((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      refetch()
    }
    setPendingDelete(null)
  }

  const updateRow = (index: number, patch: Partial<BatchFormRow>) => {
    setBatchRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setBatchRows([EMPTY_ROW])
    setFormError('')
  }

  const handleBatchCreate = async (event: FormEvent) => {
    event.preventDefault()
    setFormError('')

    const invalidIndex = batchRows.findIndex(
      (row) => !row.name.trim() || !row.position.trim()
    )
    if (invalidIndex !== -1) {
      setFormError(`Row ${invalidIndex + 1}: Name and Position are required.`)
      return
    }

    if (!formRegionSeason.regionId || formRegionSeason.seasonValue === '') {
      setFormError('Region and season are required.')
      return
    }

    const payload = {
      seasonId: formRegionSeason.seasonValue as number,
      players: batchRows.map((row) => ({
        name: row.name.trim(),
        position: row.position.trim(),
        teamNames: row.teamNamesCSV
          .split(',')
          .map((name) => name.trim().toLowerCase())
          .filter(Boolean),
      })),
    }

    try {
      const created = await createBatch(payload)
      if (!created) {
        setFormError('Failed to create players. No response received.')
        return
      }
      setLocalPlayers((prev) => [...(Array.isArray(created) ? created : [created]), ...prev])
      refetch()
      closeModal()
    } catch {
      setFormError('Failed to create players. Please try again.')
    }
  }

  const columns: DataTableColumn<Player>[] = [
    { key: 'id', header: 'ID', width: 'w-16', render: (player) => player.id },
    {
      key: 'name',
      header: 'Name',
      render: (player) => (
        <InlineEditCell
          label="Player name"
          value={player.name}
          onCommit={(value) => commitEdit(player, 'name', value)}
        />
      ),
    },
    {
      key: 'position',
      header: 'Position',
      render: (player) => (
        <InlineEditCell
          label="Player position"
          value={player.position ?? ''}
          placeholder="Unknown"
          onCommit={(value) => commitEdit(player, 'position', value)}
        />
      ),
    },
    {
      key: 'teams',
      header: 'Teams',
      hideOnMobile: true,
      render: (player) => (
        <OverflowListCell
          items={player.teams?.map((team) => team.name) ?? []}
          maxVisible={2}
          emptyLabel="No teams"
          popoverTitle="Teams"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 'w-28',
      render: (player) =>
        canDelete ? (
          <Button
            variant="danger"
            size="xs"
            disabled={deleting}
            onClick={() => setPendingDelete(player)}
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
        title="Players"
        actions={
          <Button
            onClick={() => {
              formRegionSeason.initFromActiveRegion()
              setIsModalOpen(true)
            }}
          >
            Create Players
          </Button>
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
              placeholder="Search players…"
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

      <ResultsCounter page={currentPage} pageSize={PLAYERS_PER_PAGE} total={total} noun="players" />

      {saveError && <ErrorNotice message={saveError} />}
      {deleteError && <ErrorNotice message={deleteError} />}

      <DataTable
        columns={columns}
        rows={localPlayers}
        rowKey={(player) => player.id}
        loading={loading}
        error={error}
        emptyLabel="No players found."
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Batch Create Players" size="lg">
        <form onSubmit={handleBatchCreate} className="flex flex-col gap-5">
          {formError && <ErrorNotice message={formError} />}
          {batchError && <ErrorNotice message={batchError} />}

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

          <div className="flex flex-col gap-3">
            <div
              aria-hidden
              className="hidden gap-2 px-1 text-xs font-medium uppercase tracking-wide text-content-tertiary md:grid md:grid-cols-[1fr_1fr_1.5fr_auto]"
            >
              <span>Name*</span>
              <span>Position*</span>
              <span>Teams</span>
              <span className="w-20" />
            </div>

            {batchRows.map((row, index) => (
              <div
                key={index}
                className="grid gap-2 md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-center"
              >
                <TextInput
                  size="sm"
                  placeholder="Player name"
                  aria-label={`Row ${index + 1} name`}
                  value={row.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  required
                />
                <TextInput
                  size="sm"
                  placeholder="e.g. OH, S, MB"
                  aria-label={`Row ${index + 1} position`}
                  value={row.position}
                  onChange={(e) => updateRow(index, { position: e.target.value })}
                  required
                />
                <TextInput
                  size="sm"
                  placeholder="Team names (comma-separated)"
                  aria-label={`Row ${index + 1} teams`}
                  value={row.teamNamesCSV}
                  onChange={(e) => updateRow(index, { teamNamesCSV: e.target.value })}
                />
                {batchRows.length > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-20"
                    onClick={() => setBatchRows((rows) => rows.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                ) : (
                  <span className="hidden w-20 md:block" />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setBatchRows((rows) => [...rows, EMPTY_ROW])}
            >
              + Add Another
            </Button>
            <Button type="submit" loading={batchLoading} loadingLabel="Creating…">
              Submit All
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete player"
        confirmLabel="Delete"
        message={
          <>
            Delete <strong>{pendingDelete?.name}</strong>? This removes the player and cannot be
            undone.
          </>
        }
      />
    </PageContainer>
  )
}
