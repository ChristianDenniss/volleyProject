/**
 * usePortalDashboard — the single data source for the admin portal's landing page.
 *
 * The dashboard needs a count from eight different collections. Fetching them from the
 * component would put raw `fetch` calls in the view layer (CLAUDE.md Rule 3) and leave the
 * page juggling eight independent loading flags; this hook issues them in parallel and hands
 * back one `counts` object plus one `loading` flag.
 *
 * A collection that fails or returns a non-JSON body resolves to an empty list rather than
 * rejecting the whole batch, so one broken endpoint doesn't blank the entire dashboard.
 */
import { useCallback, useEffect, useState } from 'react'
import { BACKEND_URL } from '@/constants/api'
import { authFetch } from './authFetch'

/** The collections the dashboard counts, in the order their tiles appear. */
const COLLECTIONS = [
  'stats',
  'teams',
  'articles',
  'players',
  'seasons',
  'games',
  'users',
  'awards',
] as const

type Collection = (typeof COLLECTIONS)[number]

interface GameLike {
  status?: string
}

export interface PortalDashboardCounts {
  teams: number
  users: number
  stats: number
  articles: number
  players: number
  seasons: number
  awards: number
  games: number
  scheduledGames: number
  completedGames: number
}

const EMPTY_COUNTS: PortalDashboardCounts = {
  teams: 0,
  users: 0,
  stats: 0,
  articles: 0,
  players: 0,
  seasons: 0,
  awards: 0,
  games: 0,
  scheduledGames: 0,
  completedGames: 0,
}

/** Normalises the two response shapes the API uses — a bare array, or `{ data: [...] }`. */
async function fetchCollection(name: Collection): Promise<unknown[]> {
  try {
    const response = await authFetch(`${BACKEND_URL}/api/${name}`, { method: 'GET' })
    const contentType = response.headers.get('content-type') ?? ''
    if (!response.ok || !contentType.includes('application/json')) return []

    const json = await response.json()
    const items = Array.isArray(json) ? json : json?.data
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function usePortalDashboard() {
  const [counts, setCounts] = useState<PortalDashboardCounts>(EMPTY_COUNTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const results = await Promise.all(COLLECTIONS.map(fetchCollection))
      const [stats, teams, articles, players, seasons, games, users, awards] = results

      const gameList = games as GameLike[]

      setCounts({
        stats: stats.length,
        teams: teams.length,
        articles: articles.length,
        players: players.length,
        seasons: seasons.length,
        games: gameList.length,
        users: users.length,
        awards: awards.length,
        scheduledGames: gameList.filter((game) => game.status === 'scheduled').length,
        completedGames: gameList.filter((game) => game.status === 'completed').length,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { counts, loading, error, refetch: load }
}
