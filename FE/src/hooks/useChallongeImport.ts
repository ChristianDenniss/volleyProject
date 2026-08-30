/**
 * useChallongeImport — posts a Challonge bracket URL to the games importer.
 *
 * The import is all-or-nothing: if any Challonge participant can't be matched to an existing
 * team in the chosen season, the API returns the unmatched list instead of creating anything.
 * That list is a *result*, not an exception, so this hook returns it as `unmatchedTeams` for
 * the form to render inline rather than throwing.
 *
 * Lives here rather than in the import form because API calls belong in hooks (CLAUDE.md Rule 3).
 */
import { useCallback, useState } from 'react'
import { authFetch } from './authFetch'
import { BACKEND_URL } from '@/constants/api'
import { useAuth } from '@/context/authContext'
import type { ImportChallongeInput, ChallongeImportResult } from '@/types/interfaces'

export interface UnmatchedTeam {
  participantName: string
  reason: string
}

export function useChallongeImport() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unmatchedTeams, setUnmatchedTeams] = useState<UnmatchedTeam[]>([])

  const importGames = useCallback(
    async (payload: ImportChallongeInput): Promise<ChallongeImportResult | null> => {
      setLoading(true)
      setError(null)
      setUnmatchedTeams([])

      try {
        const response = await authFetch(
          `${BACKEND_URL}/api/games/import-challonge`,
          { method: 'POST', body: JSON.stringify(payload) },
          token,
        )
        const result = (await response.json()) as ChallongeImportResult

        if (!response.ok || !result.success) {
          if (result.unmatchedTeams?.length) {
            setUnmatchedTeams(
              result.unmatchedTeams.map((team) => ({
                participantName: team.participantName,
                reason: team.reason,
              })),
            )
          }
          setError(result.error || 'Failed to import games from Challonge')
          return null
        }

        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        return null
      } finally {
        setLoading(false)
      }
    },
    [token],
  )

  return { importGames, loading, error, unmatchedTeams, setError }
}
