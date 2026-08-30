/**
 * AwardsPage — the admin portal's award management view: a paginated, searchable table filtered by season and award type, with every column inline-editable (type as a select, awarded date as a date picker, artwork as a thumbnail) and a create-award modal.
 * Each inline edit is staged into `pendingEdit` and confirmed before the PATCH, so a stray click on a select can't silently rewrite an award; deletion is superadmin-only.
 * Lives in `components/portal/`; mounted at /portal/awards.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSkinnyAwards, useSkinnySeasons } from '@/hooks/allFetch'
import { useAwardsMutations } from '@/hooks/allPatch'
import { useCreateAwards } from '@/hooks/allCreate'
import { useDeleteAwards } from '@/hooks/allDelete'
import { useAuth } from '@/context/authContext'
import { useRegion } from '@/context/regionContext'
import { useFormRegionSeason } from '@/hooks/useFormRegionSeason'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { AWARD_TYPES } from '@/constants/awardTypes'
import type { Award } from '@/types/interfaces'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Toolbar from '@/components/ui/layout/Toolbar'
import ResultsCounter from '@/components/ui/layout/ResultsCounter'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import FilterBar from '@/components/ui/filters/FilterBar'
import FilterSelect from '@/components/ui/filters/FilterSelect'
import SearchBar from '@/components/ui/filters/SearchBar'
import Pagination from '@/components/ui/navigation/Pagination'
import Button from '@/components/ui/buttons/Button'
import Modal from '@/components/ui/modals/Modal'
import ConfirmModal from '@/components/ui/modals/ConfirmModal'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import FormField from '@/components/ui/inputs/FormField'
import TextInput, { TextArea } from '@/components/ui/inputs/TextInput'
import Select, { toOptions } from '@/components/ui/inputs/Select'
import InlineEditCell from '@/components/ui/inputs/InlineEditCell'
import RegionSeasonFields from '@/components/ui/inputs/RegionSeasonFields'

const AWARDS_PER_PAGE = 10

type EditField = 'type' | 'description' | 'seasonId' | 'playerName' | 'imageUrl' | 'createdAt'

const FIELD_LABELS: Record<EditField, string> = {
  type: 'Type',
  description: 'Description',
  seasonId: 'Season ID',
  playerName: 'Player Name',
  imageUrl: 'Image URL',
  createdAt: 'Award Date',
}

interface PendingEdit {
  award: Award
  field: EditField
  value: string
  previous: string
}

export default function AwardsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [awardTypeFilter, setAwardTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { regionQuery } = useRegion()
  const { user } = useAuth()
  const formRegionSeason = useFormRegionSeason('id')

  const { data: awards, total, totalPages, loading, error, refetch } = useSkinnyAwards({
    page: currentPage,
    limit: AWARDS_PER_PAGE,
    search: debouncedSearch || undefined,
    seasonNumber: seasonFilter || undefined,
    type: awardTypeFilter || undefined,
    ...regionQuery,
  })
  const { data: seasons, loading: seasonsLoading } = useSkinnySeasons({
    page: 1,
    limit: 100,
    ...regionQuery,
  })

  const { patchAward } = useAwardsMutations()
  const { createAwards, loading: creating } = useCreateAwards()
  const { deleteItem: deleteAward, loading: deleting } = useDeleteAwards()

  const [localAwards, setLocalAwards] = useState<Award[]>([])
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Award | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newType, setNewType] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [formError, setFormError] = useState('')

  const canDelete = user?.role === 'superadmin'

  useEffect(() => {
    setLocalAwards(awards ?? [])
  }, [awards])

  const seasonOptions = useMemo(
    () =>
      [...(seasons ?? [])]
        .map((season) => season.seasonNumber)
        .sort((a, b) => a - b)
        .map((seasonNumber) => ({
          value: seasonNumber.toString(),
          label: `Season ${seasonNumber}`,
        })),
    [seasons]
  )

  const applyEdit = async () => {
    if (!pendingEdit) return
    const { award, field, value } = pendingEdit
    setPendingEdit(null)
    setSaveError(null)

    const payload: Record<string, unknown> = {}
    if (field === 'seasonId') payload.seasonId = Number(value)
    else if (field === 'playerName') payload.playerName = value.toLowerCase()
    else payload[field] = value

    try {
      const updated = await patchAward(award.id, payload)
      setLocalAwards((prev) => prev.map((a) => (a.id === award.id ? { ...a, ...updated } : a)))
      refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const wasDeleted = await deleteAward(pendingDelete.id.toString())
    if (wasDeleted) {
      setLocalAwards((prev) => prev.filter((a) => a.id !== pendingDelete.id))
      refetch()
    }
    setPendingDelete(null)
  }

  const stageEdit = (award: Award, field: EditField, value: string, previous: string) =>
    setPendingEdit({ award, field, value, previous })

  const openModal = () => {
    setIsModalOpen(true)
    setFormError('')
    setNewType('')
    setNewDescription('')
    setNewPlayerName('')
    setNewImageUrl('')
    formRegionSeason.initFromActiveRegion()
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()

    if (
      !newType.trim() ||
      formRegionSeason.seasonValue === '' ||
      !newPlayerName.trim() ||
      !newDescription.trim()
    ) {
      setFormError('Type, region, season, description, and player name are required.')
      return
    }

    try {
      const created = await createAwards({
        type: newType,
        description: newDescription,
        seasonId: formRegionSeason.seasonValue as number,
        playerName: newPlayerName.toLowerCase(),
        imageUrl: newImageUrl,
      })
      if (created) {
        setLocalAwards((prev) => [created, ...prev])
        refetch()
        setIsModalOpen(false)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create award')
    }
  }

  const columns: DataTableColumn<Award>[] = [
    { key: 'id', header: 'ID', width: 'w-16', render: (award) => award.id },
    {
      key: 'type',
      header: 'Type',
      render: (award) => (
        <InlineEditCell
          label="Award type"
          value={award.type}
          options={toOptions(AWARD_TYPES)}
          onCommit={(value) => stageEdit(award, 'type', value, award.type)}
        />
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (award) => (
        <InlineEditCell
          label="Award description"
          value={award.description}
          onCommit={(value) => stageEdit(award, 'description', value, award.description)}
        />
      ),
    },
    {
      key: 'season',
      header: 'Season',
      width: 'w-24',
      render: (award) => (
        <InlineEditCell
          label="Season id"
          type="number"
          value={award.season.id.toString()}
          display={award.season.seasonNumber}
          onCommit={(value) =>
            stageEdit(award, 'seasonId', value, award.season.id.toString())
          }
        />
      ),
    },
    {
      key: 'player',
      header: 'Player',
      render: (award) => (
        <InlineEditCell
          label="Player name"
          value={award.players[0]?.name?.toLowerCase() || ''}
          display={award.players[0]?.name || 'N/A'}
          onCommit={(value) =>
            stageEdit(award, 'playerName', value, award.players[0]?.name?.toLowerCase() || '')
          }
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Awarded Date',
      hideOnMobile: true,
      render: (award) => {
        // The control edits a YYYY-MM-DD value; the API stores a full ISO timestamp.
        const iso = new Date(award.createdAt).toISOString()
        return (
          <InlineEditCell
            label="Awarded date"
            type="date"
            value={iso.slice(0, 10)}
            display={new Date(award.createdAt).toLocaleDateString()}
            onCommit={(value) =>
              stageEdit(
                award,
                'createdAt',
                new Date(`${value}T00:00:00`).toISOString(),
                iso.slice(0, 10)
              )
            }
          />
        )
      },
    },
    {
      key: 'imageUrl',
      header: 'Image',
      hideOnMobile: true,
      width: 'w-28',
      render: (award) => (
        <InlineEditCell
          label="Image URL"
          type="url"
          value={award.imageUrl || ''}
          display={
            award.imageUrl ? (
              <img
                src={award.imageUrl}
                alt={`${award.type} award`}
                loading="lazy"
                className="max-h-11 w-auto max-w-20 rounded-control object-contain"
              />
            ) : (
              <span className="text-content-muted">No image</span>
            )
          }
          onCommit={(value) => stageEdit(award, 'imageUrl', value, award.imageUrl || '')}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 'w-28',
      render: (award) =>
        canDelete ? (
          <Button
            variant="danger"
            size="xs"
            disabled={deleting}
            onClick={() => setPendingDelete(award)}
          >
            Delete
          </Button>
        ) : (
          <span className="text-xs italic text-content-muted">No permissions</span>
        ),
    },
  ]

  const clearFilters = () => {
    setSearchQuery('')
    setSeasonFilter('')
    setAwardTypeFilter('')
    setCurrentPage(1)
  }

  return (
    <PageContainer>
      <PageHeader title="Awards" actions={<Button onClick={openModal}>Create Award</Button>} />

      <Toolbar
        filters={
          <FilterBar
            onReset={clearFilters}
            activeCount={[searchQuery, seasonFilter, awardTypeFilter].filter(Boolean).length}
          >
            <FilterSelect
              label="Season"
              value={seasonFilter}
              onChange={(value) => {
                setSeasonFilter(value)
                setCurrentPage(1)
              }}
              options={seasonOptions}
              placeholder={seasonsLoading ? 'Loading seasons…' : 'All Seasons'}
            />
            <FilterSelect
              label="Award type"
              value={awardTypeFilter}
              onChange={(value) => {
                setAwardTypeFilter(value)
                setCurrentPage(1)
              }}
              options={toOptions(AWARD_TYPES)}
              placeholder="All Award Types"
            />
          </FilterBar>
        }
        trailing={
          <>
            <SearchBar
              value={searchQuery}
              onSearch={(query) => {
                setSearchQuery(query)
                setCurrentPage(1)
              }}
              placeholder="Search player names…"
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

      <ResultsCounter page={currentPage} pageSize={AWARDS_PER_PAGE} total={total} noun="awards" />

      {saveError && <ErrorNotice message={saveError} />}

      <DataTable
        columns={columns}
        rows={localAwards}
        rowKey={(award) => award.id}
        loading={loading}
        error={error}
        emptyLabel="No awards match your filters."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Award"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-award-form" loading={creating} loadingLabel="Creating…">
              Create
            </Button>
          </>
        }
      >
        <form id="create-award-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          {formError && <ErrorNotice message={formError} />}

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

          <FormField label="Type" required>
            {(id) => (
              <Select
                id={id}
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                options={toOptions(AWARD_TYPES)}
                placeholder="Select an award type"
                required
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Player Name" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value.toLowerCase())}
                  placeholder="player name"
                  required
                />
              )}
            </FormField>

            <FormField label="Image URL">
              {(id) => (
                <TextInput
                  id={id}
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              )}
            </FormField>
          </div>

          <FormField label="Description" required>
            {(id) => (
              <TextArea
                id={id}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Award description"
                required
              />
            )}
          </FormField>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={pendingEdit !== null}
        onClose={() => setPendingEdit(null)}
        onConfirm={applyEdit}
        tone="primary"
        title={`Change ${pendingEdit ? FIELD_LABELS[pendingEdit.field] : ''}`}
        confirmLabel="Save change"
        message={
          <>
            Change {pendingEdit ? FIELD_LABELS[pendingEdit.field] : ''} from{' '}
            <strong>{pendingEdit?.previous || '(empty)'}</strong> to{' '}
            <strong>{pendingEdit?.value || '(empty)'}</strong>?
          </>
        }
      />

      <ConfirmModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete award"
        confirmLabel="Delete"
        message={
          <>
            Delete the <strong>{pendingDelete?.type}</strong> award for{' '}
            <strong>{pendingDelete?.players[0]?.name ?? 'this player'}</strong>? This cannot be
            undone.
          </>
        }
      />
    </PageContainer>
  )
}
