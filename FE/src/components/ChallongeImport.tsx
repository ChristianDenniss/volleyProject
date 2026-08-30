/**
 * ChallongeImport — the modal form that turns a Challonge bracket URL into scheduled games: pick the season, phase and round window, and every match in the bracket is created spaced by `matchSpacingMinutes`.
 * The import is all-or-nothing, so when a participant can't be matched to an existing team the modal lists the unmatched names inline instead of partially importing; a "How it works" panel states that contract up front.
 * Lives in `components/`; opened from the portal's GamesPage. The request itself lives in `useChallongeImport`.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { useFormRegionSeason } from '@/hooks/useFormRegionSeason'
import { useChallongeImport } from '@/hooks/useChallongeImport'
import type { ImportChallongeInput, ChallongeImportResult } from '@/types/interfaces'

import Modal from '@/components/ui/modals/Modal'
import Card from '@/components/ui/layout/Card'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Button from '@/components/ui/buttons/Button'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'
import Select from '@/components/ui/inputs/Select'
import RegionSeasonFields from '@/components/ui/inputs/RegionSeasonFields'
import Prose from '@/components/ui/misc/Prose'

const PHASE_OPTIONS = [
  { value: 'pre_season', label: 'Pre-Season' },
  { value: 'qualifiers', label: 'Qualifiers' },
  { value: 'playoffs', label: 'Playoffs' },
]

const DEFAULT_SPACING_MINUTES = 30

interface Props {
  onImportSuccess: (result: ChallongeImportResult) => void
  onCancel: () => void
}

export default function ChallongeImport({ onImportSuccess, onCancel }: Props) {
  const formRegionSeason = useFormRegionSeason('id')
  const { importGames, loading, error, unmatchedTeams, setError } = useChallongeImport()

  const [form, setForm] = useState<Partial<ImportChallongeInput>>({
    challongeUrl: '',
    round: '',
    roundStartDate: '',
    roundEndDate: '',
    matchSpacingMinutes: DEFAULT_SPACING_MINUTES,
    phase: 'qualifiers',
    tags: [],
  })

  useEffect(() => {
    formRegionSeason.initFromActiveRegion()
    // Seed once on mount from the active region; re-running on every render of the
    // hook's identity would clobber a selection the user has already made.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (field: keyof ImportChallongeInput, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (
      !form.challongeUrl ||
      !formRegionSeason.regionId ||
      formRegionSeason.seasonValue === '' ||
      !form.roundStartDate ||
      !form.roundEndDate
    ) {
      setError('Please fill in all required fields')
      return
    }

    if (new Date(form.roundStartDate) >= new Date(form.roundEndDate)) {
      setError('Round start date must be before round end date')
      return
    }

    const result = await importGames({
      challongeUrl: form.challongeUrl,
      seasonId: formRegionSeason.seasonValue as number,
      round: form.round,
      roundStartDate: form.roundStartDate,
      roundEndDate: form.roundEndDate,
      matchSpacingMinutes: form.matchSpacingMinutes ?? DEFAULT_SPACING_MINUTES,
      phase: form.phase ?? 'qualifiers',
      region: formRegionSeason.selectedRegion?.code ?? 'na',
      tags: form.tags,
    })

    if (result) onImportSuccess(result)
  }

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title="Import Games from Challonge"
      size="lg"
      dismissOnBackdrop={!loading}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="challonge-import-form"
            loading={loading}
            loadingLabel="Importing…"
          >
            Import Games
          </Button>
        </>
      }
    >
      <form id="challonge-import-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Challonge URL" required>
          {(id) => (
            <TextInput
              id={id}
              type="url"
              value={form.challongeUrl ?? ''}
              onChange={(e) => update('challongeUrl', e.target.value)}
              placeholder="https://challonge.com/ch2s2na"
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
          <FormField label="Phase" required>
            {(id) => (
              <Select
                id={id}
                value={form.phase ?? 'qualifiers'}
                onChange={(e) => update('phase', e.target.value)}
                options={PHASE_OPTIONS}
                required
              />
            )}
          </FormField>

          <FormField label="Minutes Between Games">
            {(id) => (
              <TextInput
                id={id}
                type="number"
                min={15}
                max={120}
                value={form.matchSpacingMinutes ?? DEFAULT_SPACING_MINUTES}
                onChange={(e) => update('matchSpacingMinutes', Number.parseInt(e.target.value, 10))}
              />
            )}
          </FormField>

          <FormField label="Challonge Round Filter" hint="Leave empty to import all rounds.">
            {(id) => (
              <TextInput
                id={id}
                value={form.round ?? ''}
                onChange={(e) => update('round', e.target.value)}
                placeholder="e.g. 1 or Round 1"
              />
            )}
          </FormField>

          <FormField label="Tags" hint="Optional, comma-separated.">
            {(id) => (
              <TextInput
                id={id}
                value={form.tags?.join(', ') ?? ''}
                onChange={(e) =>
                  update(
                    'tags',
                    e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="e.g. RVL, Invitational"
              />
            )}
          </FormField>

          <FormField label="Round Start Date/Time" required>
            {(id) => (
              <TextInput
                id={id}
                type="datetime-local"
                value={form.roundStartDate ?? ''}
                onChange={(e) => update('roundStartDate', e.target.value)}
                required
              />
            )}
          </FormField>

          <FormField label="Round End Date/Time" required>
            {(id) => (
              <TextInput
                id={id}
                type="datetime-local"
                value={form.roundEndDate ?? ''}
                onChange={(e) => update('roundEndDate', e.target.value)}
                required
              />
            )}
          </FormField>
        </div>

        {error && <ErrorNotice message={error} />}

        {unmatchedTeams.length > 0 && (
          <ErrorNotice
            title="Unmatched teams"
            message={
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
                {unmatchedTeams.map((item, index) => (
                  <li key={index}>
                    {item.participantName}: {item.reason}
                  </li>
                ))}
              </ul>
            }
          />
        )}

        <Card tone="inset" padding="md">
          <SectionHeader title="How it works" level={4} />
          <Prose size="sm">
            <ul>
              <li>
                <strong>Teams must exist</strong> in the selected season before import — none are
                created automatically
              </li>
              <li>
                <strong>All-or-nothing:</strong> if any team cannot be matched, the entire import
                is aborted
              </li>
              <li>
                <strong>Re-import:</strong> existing games update only when teams match; identical
                games are skipped
              </li>
              <li>
                <strong>Stages:</strong> Swiss/qualifier rounds map to &quot;Round N&quot;;
                playoffs use clean labels like &quot;Round of 16&quot; with winners/losers on the
                bracket field
              </li>
            </ul>
          </Prose>
        </Card>
      </form>
    </Modal>
  )
}
