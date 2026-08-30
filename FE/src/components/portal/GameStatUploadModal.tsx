/**
 * GameStatUploadModal — the per-game stat-sheet importer opened from a row in the portal's games table: pick a CSV, and its player rows are attached to that game.
 * Parsing happens in the browser before the request, so a malformed sheet or one with no player rows fails with a message here instead of reaching the API.
 * Lives in `components/portal/`; rendered by GamesPage — the bulk importer that can also *create* a game lives on StatsPage.
 */
import { useState, type ChangeEvent } from 'react'
import { parseCSV } from '@/utils/csvParser'
import { useAddStatsToExistingGame } from '@/hooks/allCreate'
import type { Game } from '@/types/interfaces'

import Modal from '@/components/ui/modals/Modal'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import LoadingSpinner from '@/components/ui/feedback/LoadingSpinner'
import FormField from '@/components/ui/inputs/FormField'

interface Props {
  game: Game | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const FILE_INPUT_CLASSES =
  'w-full cursor-pointer rounded-control border border-border bg-surface p-2 text-sm text-content-secondary file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-on-brand disabled:cursor-not-allowed disabled:opacity-60'

export default function GameStatUploadModal({ game, isOpen, onClose, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null)
  const { addStatsToGame, loading } = useAddStatsToExistingGame((err: { message?: string }) =>
    setError(err.message ?? 'Upload failed')
  )

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !game) return

    setError(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const parsed = parseCSV(e.target?.result as string, 'add')
        if (!parsed.statsData.length) {
          throw new Error('No player stats found in CSV')
        }

        const result = await addStatsToGame(game.id, parsed.statsData)
        if (result) {
          onSuccess()
          onClose()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV')
      }
    }
    reader.readAsText(file)
  }

  if (!isOpen || !game) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload Stats — ${game.name || `Game #${game.id}`}`}
      size="sm"
      dismissOnBackdrop={!loading}
    >
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-content-secondary">
          Upload a stat sheet CSV for this game. Stats will be attached to game #{game.id}.
        </p>

        <FormField label="Stat sheet">
          {(id) => (
            <input
              id={id}
              type="file"
              accept=".csv"
              disabled={loading}
              onChange={handleFileChange}
              className={FILE_INPUT_CLASSES}
            />
          )}
        </FormField>

        {loading && (
          <p className="m-0 flex items-center gap-2 text-sm text-content-tertiary">
            <LoadingSpinner size="sm" label={null} />
            Uploading stats…
          </p>
        )}

        {error && <ErrorNotice message={error} />}
      </div>
    </Modal>
  )
}
