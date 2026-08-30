/**
 * useTeamStaffEdit — decides whether the signed-in user may edit a team, and saves the edit.
 *
 * "May edit" is three conditions, all of which must hold: the user holds one of the team's
 * three staff roles, the season allows staff edits, and the team itself has not been locked.
 * The team record is refetched rather than trusted from props, because the two `captainEditEnabled`
 * flags are toggled from the admin portal and a stale copy would show an editable form that the
 * API then rejects.
 *
 * API calls belong in hooks (CLAUDE.md Rule 3) — TeamStaffEdit renders only.
 */
import { useCallback, useEffect, useState } from 'react'
import { authFetch } from './authFetch'
import { BACKEND_URL } from '@/constants/api'
import { useAuth } from '@/context/authContext'
import type { Team } from '@/types/interfaces'

export type StaffRole = 'captain' | 'vice_captain' | 'court_captain'

export interface RosterEntry {
  discord: string
  roblox: string
}

export interface StaffEditPayload {
  /** Only the captain may rename the team, so this is omitted for the other two roles. */
  name?: string
  hexColor: string
  brickColor: string
  logoUrl: string | null
  roster: RosterEntry[]
}

interface TeamRecord {
  captainUserId?: number
  viceCaptainUserId?: number
  courtCaptainUserId?: number
  captainEditEnabled?: boolean
  season?: { captainEditEnabled?: boolean }
}

/** Which staff role the user holds on this team, or null. */
function staffRoleFor(team: TeamRecord, userId: number): StaffRole | null {
  if (team.captainUserId === userId) return 'captain'
  if (team.viceCaptainUserId === userId) return 'vice_captain'
  if (team.courtCaptainUserId === userId) return 'court_captain'
  return null
}

export function useTeamStaffEdit(teamId: number) {
  const { user, isAuthenticated } = useAuth()

  const [staffRole, setStaffRole] = useState<StaffRole | null>(null)
  /** True only when the user is staff AND neither the season nor the team is locked. */
  const [canEdit, setCanEdit] = useState(false)
  /** True when the user is staff but editing is locked — the page explains why. */
  const [isLocked, setIsLocked] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    let cancelled = false

    void (async () => {
      const res = await authFetch(`${BACKEND_URL}/api/teams/${teamId}`)
      if (!res.ok) return

      const team = (await res.json()) as TeamRecord
      if (cancelled) return

      const role = staffRoleFor(team, user.id)
      const seasonAllows = team.season?.captainEditEnabled !== false
      const teamAllows = team.captainEditEnabled !== false

      setStaffRole(role)
      setCanEdit(Boolean(role) && seasonAllows && teamAllows)
      setIsLocked(Boolean(role) && !(seasonAllows && teamAllows))
    })()

    return () => {
      cancelled = true
    }
  }, [teamId, isAuthenticated, user])

  /** Resolves to the updated team, or throws with the API's message. */
  const save = useCallback(
    async (payload: StaffEditPayload): Promise<Team> => {
      setSaving(true)
      try {
        const res = await authFetch(`${BACKEND_URL}/api/teams/${teamId}/staff`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Save failed')
        return data as Team
      } finally {
        setSaving(false)
      }
    },
    [teamId],
  )

  return { staffRole, canEdit, isLocked, saving, save }
}
