/**
 * useSessionApi — the two session-level requests the app's Context providers need: fetching the
 * signed-in user's profile from the auth cookie, and ending the session server-side.
 *
 * These are plain functions rather than React hooks because the callers are Provider bodies,
 * not components — but they belong in `hooks/` all the same: the rule is that HTTP lives in one
 * layer (CLAUDE.md Rule 3), so a Context can't quietly become a second place fetches happen.
 *
 * Both are cookie-authenticated (`credentials: 'include'`) rather than bearer-token, which is
 * why they don't go through `authFetch`.
 */
import { BACKEND_URL } from '@/constants/api'
import type { User } from '@/types/interfaces'
import type { Region } from '@/context/regionContext'

/**
 * Resolves the current user from the session cookie, or null when there is no valid session.
 * Never throws — a network failure and a 401 are the same outcome for the caller: signed out.
 */
export async function fetchSessionUser(): Promise<User | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/profile`, { credentials: 'include' })
    if (!res.ok) return null

    const profile = (await res.json()) as User & { password?: string }
    // Defensive: strip a password field if the API ever includes one.
    delete profile.password
    return profile as User
  } catch {
    return null
  }
}

/** Ends the session server-side. Resolves either way — the client clears its state regardless. */
export async function endSession(): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/users/logout`, { method: 'POST', credentials: 'include' })
  } catch {
    // The cookie may already be gone; the caller clears local state unconditionally.
  }
}

/**
 * Loads the league's regions. Used by `regionContext` to seed the region switcher.
 *
 * Unauthenticated and cache-friendly — the region list is public reference data, not
 * session-scoped, so it needs neither a cookie nor a bearer token.
 */
export async function fetchRegions(): Promise<Region[]> {
  const res = await fetch(`${BACKEND_URL}/api/regions`)
  if (!res.ok) throw new Error('Failed to load regions')
  return (await res.json()) as Region[]
}
