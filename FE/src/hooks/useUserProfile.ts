/**
 * useUserProfile — loads the signed-in user's own account record, and owns the two Roblox
 * link/unlink actions that mutate it.
 *
 * A 401 here means the stored token is no longer valid, so the hook reports `unauthorized`
 * rather than an error message: the profile page's response to that is to log out and redirect,
 * which is a routing decision, not something a data hook should perform.
 *
 * API calls belong in hooks (CLAUDE.md Rule 3) — the page renders only.
 */
import { useCallback, useEffect, useState } from 'react'
import { authFetch } from './authFetch'
import { BACKEND_URL } from '@/constants/api'
import { useAuth } from '@/context/authContext'

export interface ProfileArticle {
  id: number
  title: string
  approved: boolean
}

export interface UserProfileData {
  id: number
  username: string
  email: string | null
  role: string
  createdAt: string
  updatedAt: string
  robloxUsername?: string | null
  robloxUserId?: string | null
  hasPassword?: boolean
  articles?: ProfileArticle[]
}

export function useUserProfile(enabled: boolean) {
  const { token } = useAuth()

  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** True when the server rejected the token — the caller decides what to do about it. */
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await authFetch(`${BACKEND_URL}/api/users/profile`, { method: 'GET' }, token)

        if (res.status === 401) {
          if (!cancelled) setUnauthorized(true)
          return
        }

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load profile')
        if (!cancelled) setProfile(data as UserProfileData)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, token])

  /** Unlinks the connected Roblox account, merging the server's updated record into state. */
  const unlinkRoblox = useCallback(async (): Promise<string | null> => {
    const res = await authFetch(
      `${BACKEND_URL}/api/auth/roblox/unlink`,
      { method: 'POST' },
      token,
    )

    if (res.ok) {
      const data = await res.json()
      setProfile((current) => (current ? { ...current, ...data } : current))
      return null
    }

    const data = await res.json().catch(() => ({}))
    return data.error || 'Failed to unlink'
  }, [token])

  return { profile, loading, error, unauthorized, unlinkRoblox }
}
