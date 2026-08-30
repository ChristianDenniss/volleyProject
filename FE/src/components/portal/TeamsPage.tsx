/**
 * TeamsPage — the admin portal's team management view: a paginated, searchable, season-filtered table with inline editing of name, season number, placement and logo URL, a staff-edit flag toggle, and a create-team modal.
 * Every inline edit routes through `InlineEditCell` and confirms via `ConfirmModal` before the PATCH, so a mis-click can't silently rewrite a team; deletion is superadmin-only.
 * Lives in `components/portal/`; mounted at /portal/teams.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSkinnyTeams, useSkinnySeasons } from '@/hooks/allFetch'
import { useTeamMutations } from '@/hooks/allPatch'
import { useCreateTeams } from '@/hooks/allCreate'
import { useDeleteTeams } from '@/hooks/allDelete'
import { useAuth } from '@/context/authContext'
import { useRegion } from '@/context/regionContext'
import { useFormRegionSeason } from '@/hooks/useFormRegionSeason'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { TEAM_PLACEMENT_OPTIONS } from '@/constants/teamPlacements'
import type { Team } from '@/types/interfaces'

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
import TextInput from '@/components/ui/inputs/TextInput'
import Select, { toOptions } from '@/components/ui/inputs/Select'
import Checkbox from '@/components/ui/inputs/Checkbox'
import InlineEditCell from '@/components/ui/inputs/InlineEditCell'
import RegionSeasonFields from '@/components/ui/inputs/RegionSeasonFields'

const TEAMS_PER_PAGE = 10
const DEFAULT_PLACEMENT = 'Didnt make playoffs'

type EditField = 'name' | 'seasonNumber' | 'placement' | 'logoUrl'

const FIELD_LABELS: Record<EditField, string> = {
  name: 'Name',
  seasonNumber: 'Season Number',
  placement: 'Placement',
  logoUrl: 'Logo URL',
}

interface PendingEdit {
  team: Team
  field: EditField
  value: string
  previous: string
}

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { regionQuery } = useRegion()
  const { user } = useAuth()
  const formRegionSeason = useFormRegionSeason('seasonNumber')

  const { data: teams, total, totalPages, loading, error, refetch } = useSkinnyTeams({
    page: currentPage,
    limit: TEAMS_PER_PAGE,
    search: debouncedSearch || undefined,
    seasonId: seasonFilter || undefined,
    ...regionQuery,
  })
  const { data: seasons, loading: seasonsLoading } = useSkinnySeasons({
    page: 1,
    limit: 100,
    ...regionQuery,
  })

  const { patchTeam, patchTeamFlags } = useTeamMutations()
  const { createTeam, loading: creating, error: createError } = useCreateTeams()
  const { deleteItem: deleteTeam, loading: deleting, error: deleteError } = useDeleteTeams()

  const [localTeams, setLocalTeams] = useState<Team[]>([])
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Team | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlacement, setNewPlacement] = useState(DEFAULT_PLACEMENT)
  const [newLogoUrl, setNewLogoUrl] = useState('')
  const [formError, setFormError] = useState('')

  const canDelete = user?.role === 'superadmin'

  useEffect(() => {
    setLocalTeams(teams ?? [])
  }, [teams])

  // Season options come from the full seasons list, not just the teams on this page.
  const seasonOptions = useMemo(
    () =>
      [...(seasons ?? [])]
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map((season) => ({ value: season.id.toString(), label: `Season ${season.seasonNumber}` })),
    [seasons]
  )

  const applyEdit = async () => {
    if (!pendingEdit) return
    const { team, field, value } = pendingEdit
    setPendingEdit(null)
    setSaveError(null)

    const payload: Partial<Team> & Record<string, unknown> = {}
    if (field === 'seasonNumber') payload.seasonNumber = Number(value)
    else if (field === 'logoUrl') payload.logoUrl = value.trim() || undefined
    else payload[field] = value

    try {
      const updated = await patchTeam(team.id, payload)
      setLocalTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, ...updated } : t)))
      refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.')
    }
  }

  const toggleStaffEdit = async (team: Team, enabled: boolean) => {
    setSaveError(null)
    try {
      const updated = await patchTeamFlags(team.id, { captainEditEnabled: enabled })
      setLocalTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, ...updated } : t)))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update the staff-edit flag.')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const wasDeleted = await deleteTeam(pendingDelete.id.toString())
    if (wasDeleted) {
      setLocalTeams((prev) => prev.filter((t) => t.id !== pendingDelete.id))
      refetch()
    }
    setPendingDelete(null)
  }

  const openModal = () => {
    setIsModalOpen(true)
    setFormError('')
    setNewName('')
    setNewPlacement(DEFAULT_PLACEMENT)
    setNewLogoUrl('')
    formRegionSeason.initFromActiveRegion()
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()

    if (!newName.trim() || !formRegionSeason.regionId || formRegionSeason.seasonValue === '') {
      setFormError('Name, region, and season are required.')
      return
    }

    const created = await createTeam({
      name: newName,
      seasonNumber: formRegionSeason.seasonValue as number,
      placement: newPlacement,
      logoUrl: newLogoUrl.trim() || undefined,
      ...formRegionSeason.regionPayload,
    })

    if (created) {
      setLocalTeams((prev) => [created, ...prev])
      refetch()
      setIsModalOpen(false)
    }
  }

  /** Builds an inline-editable cell that stages the change for confirmation. */
  const editableCell = (team: Team, field: EditField, current: string, placeholder?: string) => (
    <InlineEditCell
      label={`Team ${FIELD_LABELS[field]}`}
      value={current}
      placeholder={placeholder}
      onCommit={(value) => setPendingEdit({ team, field, value, previous: current })}
    />
  )

  const columns: DataTableColumn<Team>[] = [
    { key: 'id', header: 'ID', width: 'w-16', render: (team) => team.id },
    { key: 'name', header: 'Name', render: (team) => editableCell(team, 'name', team.name) },
    {
      key: 'seasonNumber',
      header: 'Season',
      width: 'w-24',
      render: (team) => editableCell(team, 'seasonNumber', team.season.seasonNumber.toString()),
    },
    {
      key: 'placement',
      header: 'Placement',
      render: (team) => editableCell(team, 'placement', team.placement),
    },
    {
      key: 'logoUrl',
      header: 'Logo URL',
      hideOnMobile: true,
      render: (team) => editableCell(team, 'logoUrl', team.logoUrl || '', 'N/A'),
    },
    {
      key: 'captainEditEnabled',
      header: 'Staff Edit',
      align: 'center',
      width: 'w-24',
      render: (team) => (
        <Checkbox
          label=""
          aria-label={`Allow staff edits for ${team.name}`}
          checked={team.captainEditEnabled !== false}
          onChange={(e) => toggleStaffEdit(team, e.target.checked)}
          className="justify-center"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 'w-28',
      render: (team) =>
        canDelete ? (
          <Button
            variant="danger"
            size="xs"
            disabled={deleting}
            onClick={() => setPendingDelete(team)}
          >
            Delete
          </Button>
        ) : (
          <span className="text-xs text-content-muted">No permission</span>
        ),
    },
  ]

  const clearFilters = () => {
    setSearchQuery('')
    setSeasonFilter('')
    setCurrentPage(1)
  }

  return (
    <PageContainer>
      <PageHeader title="Teams" actions={<Button onClick={openModal}>Create Team</Button>} />

      <Toolbar
        filters={
          <FilterBar
            onReset={clearFilters}
            activeCount={[searchQuery, seasonFilter].filter(Boolean).length}
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
              placeholder="Search teams…"
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

      <ResultsCounter page={currentPage} pageSize={TEAMS_PER_PAGE} total={total} noun="teams" />

      {saveError && <ErrorNotice message={saveError} />}
      {deleteError && <ErrorNotice message={deleteError} />}

      <DataTable
        columns={columns}
        rows={localTeams}
        rowKey={(team) => team.id}
        loading={loading}
        error={error}
        emptyLabel="No teams match your filters."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Team" size="md">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
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
            seasonValueKey="seasonNumber"
          />

          <FormField label="Placement">
            {(id) => (
              <Select
                id={id}
                value={newPlacement}
                onChange={(e) => setNewPlacement(e.target.value)}
                options={toOptions(TEAM_PLACEMENT_OPTIONS)}
              />
            )}
          </FormField>

          <FormField label="Logo URL" hint="Optional — shown as the team's crest and card watermark.">
            {(id) => (
              <TextInput
                id={id}
                type="url"
                value={newLogoUrl}
                onChange={(e) => setNewLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            )}
          </FormField>

          <Button type="submit" loading={creating} loadingLabel="Creating…" className="self-start">
            Submit
          </Button>
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
        title="Delete team"
        confirmLabel="Delete"
        message={
          <>
            Delete <strong>{pendingDelete?.name}</strong>? This cannot be undone.
          </>
        }
      />
    </PageContainer>
  )
}
