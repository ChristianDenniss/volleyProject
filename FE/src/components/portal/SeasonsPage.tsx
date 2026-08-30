/**
 * SeasonsPage — the admin portal's season management view: a table with inline editing of theme, image URL and date range, direct toggles for the registrations-open and staff-edit flags, an editable team cap, and a create-season modal.
 * Text and date edits stage a confirmation before the PATCH; the boolean flags and the team cap apply immediately, because they are single-click toggles where a confirm dialog would be more disruptive than the change.
 * Lives in `components/portal/`; mounted at /portal/seasons.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { useSkinnySeasons } from '@/hooks/allFetch'
import { useSeasonMutations } from '@/hooks/allPatch'
import { useCreateSeasons } from '@/hooks/allCreate'
import { useDeleteSeasons } from '@/hooks/allDelete'
import { useAuth } from '@/context/authContext'
import { useRegion } from '@/context/regionContext'
import { useFormRegionSeason } from '@/hooks/useFormRegionSeason'
import type { Season } from '@/types/interfaces'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Toolbar from '@/components/ui/layout/Toolbar'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import Pagination from '@/components/ui/navigation/Pagination'
import Button from '@/components/ui/buttons/Button'
import Modal from '@/components/ui/modals/Modal'
import ConfirmModal from '@/components/ui/modals/ConfirmModal'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'
import Checkbox from '@/components/ui/inputs/Checkbox'
import InlineEditCell from '@/components/ui/inputs/InlineEditCell'
import RegionSeasonFields from '@/components/ui/inputs/RegionSeasonFields'

const SEASONS_PER_PAGE = 20

type EditField = 'theme' | 'image' | 'startDate' | 'endDate'

const FIELD_LABELS: Record<EditField, string> = {
  theme: 'theme',
  image: 'image URL',
  startDate: 'start date',
  endDate: 'end date',
}

interface PendingEdit {
  season: Season
  field: EditField
  value: string
  previous: string
}

/** A date column edits YYYY-MM-DD; an absent end date means the season is ongoing. */
function toDateInput(date: Date | string | undefined | null): string {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

export default function SeasonsPage() {
  const { regionQuery, activeRegion } = useRegion()
  const { user } = useAuth()
  const formRegionSeason = useFormRegionSeason()

  const [currentPage, setCurrentPage] = useState(1)

  const { data: seasons, totalPages, loading, error } = useSkinnySeasons({
    page: currentPage,
    limit: SEASONS_PER_PAGE,
    ...regionQuery,
  })

  const { patchSeason } = useSeasonMutations()
  const { createSeason, loading: creating } = useCreateSeasons()
  const { deleteItem: deleteSeason, loading: deleting, error: deleteError } = useDeleteSeasons()

  const [localSeasons, setLocalSeasons] = useState<Season[]>([])
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Season | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSeasonNumber, setNewSeasonNumber] = useState(0)
  const [newTheme, setNewTheme] = useState('')
  const [newImage, setNewImage] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [formError, setFormError] = useState('')

  const canDelete = user?.role === 'superadmin'

  useEffect(() => {
    if (seasons) setLocalSeasons(seasons)
  }, [seasons])

  // A region switch narrows the result set — page 1 is the only page guaranteed to exist.
  useEffect(() => {
    setCurrentPage(1)
  }, [activeRegion])

  /** Applies a patch and merges the response into the local row. */
  const applyPatch = async (season: Season, payload: Partial<Season>) => {
    setSaveError(null)
    try {
      const updated = await patchSeason(season.id, payload)
      setLocalSeasons((prev) => prev.map((s) => (s.id === season.id ? { ...s, ...updated } : s)))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.')
    }
  }

  const applyStagedEdit = async () => {
    if (!pendingEdit) return
    const { season, field, value } = pendingEdit
    setPendingEdit(null)

    const payload: Partial<Season> = {}
    if (field === 'theme') payload.theme = value
    else if (field === 'image') payload.image = value || undefined
    else if (field === 'startDate') payload.startDate = new Date(value)
    else payload.endDate = value ? new Date(value) : undefined

    await applyPatch(season, payload)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const wasDeleted = await deleteSeason(pendingDelete.id.toString())
    if (wasDeleted) {
      setLocalSeasons((prev) => prev.filter((s) => s.id !== pendingDelete.id))
    }
    setPendingDelete(null)
  }

  const openModal = () => {
    setIsModalOpen(true)
    setFormError('')
    setNewSeasonNumber(0)
    setNewTheme('')
    setNewImage('')
    setNewStartDate('')
    setNewEndDate('')
    formRegionSeason.initFromActiveRegion()
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()

    if (
      newSeasonNumber <= 0 ||
      !newTheme.trim() ||
      !newStartDate.trim() ||
      !formRegionSeason.regionId
    ) {
      setFormError('Region, season number, theme, and start date are required.')
      return
    }

    const created = await createSeason({
      seasonNumber: newSeasonNumber,
      theme: newTheme,
      image: newImage || undefined,
      startDate: new Date(newStartDate).toISOString(),
      endDate: newEndDate ? new Date(newEndDate).toISOString() : undefined,
      ...formRegionSeason.regionPayload,
    })

    if (created) {
      setLocalSeasons((prev) => [created, ...prev])
      setIsModalOpen(false)
    }
  }

  const stageEdit = (season: Season, field: EditField, value: string, previous: string) =>
    setPendingEdit({ season, field, value, previous })

  const columns: DataTableColumn<Season>[] = [
    {
      key: 'seasonNumber',
      header: 'Season #',
      width: 'w-24',
      render: (row) => <span className="font-medium text-content">{row.seasonNumber}</span>,
    },
    {
      key: 'theme',
      header: 'Theme',
      render: (row) => (
        <InlineEditCell
          label="Theme"
          value={row.theme}
          onCommit={(value) => stageEdit(row, 'theme', value, row.theme)}
        />
      ),
    },
    {
      key: 'registrationsOpen',
      header: 'Apps Open',
      align: 'center',
      width: 'w-24',
      render: (row) => (
        <Checkbox
          label=""
          aria-label={`Registrations open for season ${row.seasonNumber}`}
          checked={Boolean(row.registrationsOpen)}
          onChange={(e) => applyPatch(row, { registrationsOpen: e.target.checked })}
          className="justify-center"
        />
      ),
    },
    {
      key: 'captainEditEnabled',
      header: 'Staff Edit',
      align: 'center',
      width: 'w-24',
      render: (row) => (
        <Checkbox
          label=""
          aria-label={`Allow staff edits in season ${row.seasonNumber}`}
          checked={row.captainEditEnabled !== false}
          onChange={(e) => applyPatch(row, { captainEditEnabled: e.target.checked })}
          className="justify-center"
        />
      ),
    },
    {
      key: 'maxTeams',
      header: 'Max Teams',
      align: 'center',
      width: 'w-28',
      render: (row) => (
        <TextInput
          type="number"
          min={1}
          size="sm"
          aria-label={`Maximum teams in season ${row.seasonNumber}`}
          defaultValue={row.maxTeams ?? undefined}
          placeholder="—"
          className="w-20 text-center"
          onBlur={(e) => {
            const raw = e.target.value.trim()
            void applyPatch(row, { maxTeams: raw === '' ? null : Number(raw) })
          }}
        />
      ),
    },
    {
      key: 'image',
      header: 'Image URL',
      hideOnMobile: true,
      render: (row) => (
        <InlineEditCell
          label="Image URL"
          type="url"
          value={row.image ?? ''}
          placeholder="None"
          onCommit={(value) => stageEdit(row, 'image', value, row.image ?? '')}
        />
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (row) => (
        <InlineEditCell
          label="Start date"
          type="date"
          value={toDateInput(row.startDate)}
          display={new Date(row.startDate).toLocaleDateString()}
          onCommit={(value) => stageEdit(row, 'startDate', value, toDateInput(row.startDate))}
        />
      ),
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (row) => (
        <InlineEditCell
          label="End date"
          type="date"
          value={toDateInput(row.endDate)}
          display={row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Ongoing'}
          onCommit={(value) => stageEdit(row, 'endDate', value, toDateInput(row.endDate))}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 'w-28',
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
      <PageHeader title="Seasons" actions={<Button onClick={openModal}>Create Season</Button>} />

      <Toolbar
        trailing={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        }
      />

      {saveError && <ErrorNotice message={saveError} />}
      {deleteError && <ErrorNotice message={deleteError} />}

      <DataTable
        columns={columns}
        rows={localSeasons}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyLabel="No seasons in this region yet."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Season"
        size="md"
        footer={
          <Button
            type="submit"
            form="create-season-form"
            loading={creating}
            loadingLabel="Creating…"
          >
            Submit
          </Button>
        }
      >
        <form id="create-season-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          {formError && <ErrorNotice message={formError} />}

          <RegionSeasonFields
            regions={formRegionSeason.regions}
            regionsLoading={formRegionSeason.regionsLoading}
            regionId={formRegionSeason.regionId}
            onRegionChange={formRegionSeason.setRegionId}
            includeSeason={false}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Season Number" required>
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  min={1}
                  value={newSeasonNumber}
                  onChange={(e) => setNewSeasonNumber(Number(e.target.value))}
                  required
                />
              )}
            </FormField>

            <FormField label="Theme" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  required
                />
              )}
            </FormField>

            <FormField label="Start Date" required>
              {(id) => (
                <TextInput
                  id={id}
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  required
                />
              )}
            </FormField>

            <FormField label="End Date" hint="Leave empty for an ongoing season.">
              {(id) => (
                <TextInput
                  id={id}
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              )}
            </FormField>
          </div>

          <FormField label="Image URL">
            {(id) => (
              <TextInput
                id={id}
                type="url"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
              />
            )}
          </FormField>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={pendingEdit !== null}
        onClose={() => setPendingEdit(null)}
        onConfirm={applyStagedEdit}
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
        title="Delete season"
        confirmLabel="Delete"
        message={
          <>
            Delete <strong>Season {pendingDelete?.seasonNumber}</strong>? This cannot be undone.
          </>
        }
      />
    </PageContainer>
  )
}
