/**
 * TeamStaffEdit — the in-place editor a team's captain, vice captain or court captain sees on their own team page: colors, logo and roster, plus the team name for the captain only.
 * It renders nothing at all for a non-staff visitor, and a short explanation instead of a form when staff editing has been locked for the season or the team — so the reason is visible rather than the control silently vanishing.
 * Lives in `components/`; embedded by `SingleTeam`. Permission and saving live in `useTeamStaffEdit`.
 */
import { useState } from 'react'
import { useTeamStaffEdit, type RosterEntry } from '@/hooks/useTeamStaffEdit'
import type { Team, Player } from '@/types/interfaces'

import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import Button from '@/components/ui/buttons/Button'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'
import Pill from '@/components/ui/pills/Pill'

const DEFAULT_HEX = '#2D3C50'

interface Props {
  team: Team
  onUpdated?: (team: Team) => void
}

export default function TeamStaffEdit({ team, onUpdated }: Props) {
  const { staffRole, canEdit, isLocked, saving, save } = useTeamStaffEdit(team.id)

  const [name, setName] = useState(team.name)
  const [hexColor, setHexColor] = useState(team.hexColor || DEFAULT_HEX)
  const [brickColor, setBrickColor] = useState(team.brickColor || '')
  const [logoUrl, setLogoUrl] = useState(team.logoUrl || '')
  const [roster, setRoster] = useState<RosterEntry[]>(
    (team.players || []).map((player: Player) => ({
      discord: player.discordUsername || '',
      roblox: player.robloxUsername || player.name,
    }))
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isLocked) {
    return (
      <p className="m-0 text-sm text-content-muted">
        Team editing is locked for this season or team.
      </p>
    )
  }

  if (!canEdit) return null

  const updateRosterRow = (index: number, patch: Partial<RosterEntry>) =>
    setRoster((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const handleSave = async () => {
    setMessage(null)
    setError(null)

    try {
      const updated = await save({
        // Only the captain may rename — the API rejects it from the other roles anyway.
        ...(staffRole === 'captain' ? { name } : {}),
        hexColor: hexColor.startsWith('#') ? hexColor : `#${hexColor}`,
        brickColor,
        logoUrl: logoUrl || null,
        roster,
      })
      setMessage('Saved')
      onUpdated?.(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <Card padding="lg" className="mt-6">
      <div className="flex flex-col gap-5">
        <SectionHeader
          title="Edit team"
          level={3}
          actions={staffRole && <Pill tone="accent" size="sm">{staffRole.replace('_', ' ')}</Pill>}
        />

        {error && <ErrorNotice message={error} />}
        {message && <ErrorNotice message={message} tone="info" />}

        <div className="grid gap-4 sm:grid-cols-2">
          {staffRole === 'captain' && (
            <FormField label="Name">
              {(id) => (
                <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} />
              )}
            </FormField>
          )}

          <FormField label="Hex color">
            {(id) => (
              <TextInput
                id={id}
                value={hexColor}
                onChange={(e) => setHexColor(e.target.value)}
                placeholder={DEFAULT_HEX}
              />
            )}
          </FormField>

          <FormField label="Brick color">
            {(id) => (
              <TextInput
                id={id}
                value={brickColor}
                onChange={(e) => setBrickColor(e.target.value)}
                placeholder="Roblox brick color name"
              />
            )}
          </FormField>

          <FormField label="Logo URL">
            {(id) => (
              <TextInput
                id={id}
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            )}
          </FormField>
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeader title="Roster" level={4} count={roster.length} />

          <div className="flex flex-col gap-2">
            {roster.map((row, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-2">
                <TextInput
                  size="sm"
                  placeholder="Discord"
                  aria-label={`Player ${index + 1} Discord`}
                  value={row.discord}
                  onChange={(e) => updateRosterRow(index, { discord: e.target.value })}
                />
                <TextInput
                  size="sm"
                  placeholder="Roblox"
                  aria-label={`Player ${index + 1} Roblox`}
                  value={row.roblox}
                  onChange={(e) => updateRosterRow(index, { roblox: e.target.value })}
                />
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => setRoster((rows) => [...rows, { discord: '', roblox: '' }])}
          >
            Add player
          </Button>
        </div>

        <Button
          type="button"
          className="self-start"
          loading={saving}
          loadingLabel="Saving…"
          onClick={() => void handleSave()}
        >
          Save changes
        </Button>
      </div>
    </Card>
  )
}
