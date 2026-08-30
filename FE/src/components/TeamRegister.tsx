/**
 * TeamRegister — the public team application form: eligibility acknowledgements, team identity (name and colors), captain/vice contacts, and a roster of at least ten players.
 * Rows 1 and 2 of the roster are overwritten with the captain and vice on submit, so the two are never missing from the roster even if the applicant leaves those rows blank; the whole form is gated behind sign-in.
 * Lives in `components/`; routed at /teams/register. The POST lives in `useSubmitTeamRegistration`.
 */
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/authContext'
import { useRegion } from '@/context/regionContext'
import { useRegistrationSummary, useSubmitTeamRegistration } from '@/hooks/useTeamRegistrations'
import type { RegionCode, TeamRegistrationRosterEntry } from '@/types/interfaces'
import { TEAMS_NAV_ITEMS } from '@/constants/teamsNav'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import SubNav from '@/components/ui/navigation/SubNav'
import Button from '@/components/ui/buttons/Button'
import LinkButton from '@/components/ui/buttons/LinkButton'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import { PageLoader } from '@/components/ui/feedback/LoadingSpinner'
import FormField from '@/components/ui/inputs/FormField'
import TextInput, { TextArea } from '@/components/ui/inputs/TextInput'
import Select from '@/components/ui/inputs/Select'
import Checkbox from '@/components/ui/inputs/Checkbox'

const MIN_ROSTER_SIZE = 10
const DEFAULT_HEX = '#2D3C50'
const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/

const REGION_OPTIONS = [
  { value: 'na', label: 'North American (NA)' },
  { value: 'eu', label: 'European (EU)' },
  { value: 'as', label: 'Asian (AS)' },
]

const emptyRoster = (): TeamRegistrationRosterEntry[] =>
  Array.from({ length: MIN_ROSTER_SIZE }, () => ({ discord: '', roblox: '' }))

export default function TeamRegister() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { activeRegion } = useRegion()
  const navigate = useNavigate()

  const region = (activeRegion?.code || 'na') as RegionCode
  const summary = useRegistrationSummary(region)
  const { submit, submitting } = useSubmitTeamRegistration()

  const [teamName, setTeamName] = useState('')
  const [hexColor, setHexColor] = useState(DEFAULT_HEX)
  const [brickColor, setBrickColor] = useState('')
  const [captainDiscord, setCaptainDiscord] = useState('')
  const [captainRoblox, setCaptainRoblox] = useState('')
  const [viceDiscord, setViceDiscord] = useState('')
  const [viceRoblox, setViceRoblox] = useState('')
  const [roster, setRoster] = useState(emptyRoster)
  const [agreeCivil, setAgreeCivil] = useState(false)
  const [confident, setConfident] = useState(false)
  const [logoAck, setLogoAck] = useState(false)
  const [experience, setExperience] = useState('')
  const [regionCode, setRegionCode] = useState<RegionCode>(region)
  const [error, setError] = useState<string | null>(null)

  const startLabel = useMemo(() => {
    if (!summary?.startDate) return 'TBD'
    try {
      return new Date(summary.startDate).toLocaleDateString()
    } catch {
      return 'TBD'
    }
  }, [summary?.startDate])

  if (authLoading) return <PageLoader />

  if (!isAuthenticated) {
    return (
      <PageContainer width="narrow">
        <SubNav items={TEAMS_NAV_ITEMS} activeLabel="Register a team" />
        <EmptyState
          title="Register a team"
          description="You must be logged in to submit a team application."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <LinkButton to="/login">Log in</LinkButton>
              <LinkButton to="/signup" variant="secondary">
                Sign up
              </LinkButton>
            </div>
          }
        />
      </PageContainer>
    )
  }

  const normalizedHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`

  const updateRoster = (index: number, field: 'discord' | 'roblox', value: string) => {
    setRoster((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  /** The captain and vice always occupy rows 1 and 2, whatever the applicant typed there. */
  const rosterWithStaff = (): TeamRegistrationRosterEntry[] => {
    const copy = [...roster]
    if (captainDiscord && captainRoblox) copy[0] = { discord: captainDiscord, roblox: captainRoblox }
    if (viceDiscord && viceRoblox) copy[1] = { discord: viceDiscord, roblox: viceRoblox }
    return copy
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!agreeCivil || !confident || !logoAck) {
      setError('Please answer all required yes/no and acknowledgment questions.')
      return
    }

    try {
      const id = await submit({
        region: regionCode,
        teamName,
        hexColor: normalizedHex,
        brickColor,
        captainDiscord,
        captainRoblox,
        viceDiscord,
        viceRoblox,
        roster: rosterWithStaff(),
        agreeCivilScheduling: true,
        confidentWillParticipate: true,
        priorLeagueExperience: experience || null,
        logoJerseyAck: true,
      })
      navigate(`/teams/registrations/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  return (
    <PageContainer width="wide">
      <SubNav items={TEAMS_NAV_ITEMS} activeLabel="Register a team" />

      <PageHeader
        title="Register your team"
        subtitle={
          <>
            Anyone with a site account can submit. Season start: <strong>{startLabel}</strong>.
          </>
        }
      />

      {error && <ErrorNotice message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card padding="lg">
          <div className="flex flex-col gap-4">
            <SectionHeader title="Eligibility" level={3} />

            <Checkbox
              checked={agreeCivil}
              onChange={(e) => setAgreeCivil(e.target.checked)}
              label="I understand and agree to be civil and accommodating when scheduling matches."
            />
            <Checkbox
              checked={confident}
              onChange={(e) => setConfident(e.target.checked)}
              label={`This season is set to start on ${startLabel}. I am confident the team will still participate by then.`}
            />

            <FormField label="Region">
              {(id) => (
                <Select
                  id={id}
                  value={regionCode}
                  onChange={(e) => setRegionCode(e.target.value as RegionCode)}
                  options={REGION_OPTIONS}
                />
              )}
            </FormField>

            <FormField
              label="Prior competitive Roblox Volleyball leagues"
              hint="Optional — previous RVL seasons, other leagues, and so on."
            >
              {(id) => (
                <TextArea
                  id={id}
                  rows={3}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. previous RVL seasons, other leagues…"
                />
              )}
            </FormField>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex flex-col gap-4">
            <SectionHeader title="Team" level={3} />

            <FormField label="Team name" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              )}
            </FormField>

            <FormField label="Hex color" required>
              {(id) => (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick hex color"
                    value={HEX_PATTERN.test(normalizedHex) ? normalizedHex : DEFAULT_HEX}
                    onChange={(e) => setHexColor(e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-control border border-border bg-surface p-1"
                  />
                  <TextInput
                    id={id}
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    required
                    pattern="#?[0-9A-Fa-f]{6}"
                    placeholder={DEFAULT_HEX}
                  />
                </div>
              )}
            </FormField>

            <FormField label="Brick color" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={brickColor}
                  onChange={(e) => setBrickColor(e.target.value)}
                  required
                  placeholder="Roblox brick color name"
                />
              )}
            </FormField>

            <Checkbox
              checked={logoAck}
              onChange={(e) => setLogoAck(e.target.checked)}
              label="I will prepare a logo & jerseys if accepted to RVL"
            />
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex flex-col gap-4">
            <SectionHeader title="Captain & Vice" level={3} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Captain Discord" required>
                {(id) => (
                  <TextInput
                    id={id}
                    value={captainDiscord}
                    onChange={(e) => setCaptainDiscord(e.target.value)}
                    required
                  />
                )}
              </FormField>
              <FormField label="Captain Roblox" required>
                {(id) => (
                  <TextInput
                    id={id}
                    value={captainRoblox}
                    onChange={(e) => setCaptainRoblox(e.target.value)}
                    required
                  />
                )}
              </FormField>
              <FormField label="Vice Discord" required>
                {(id) => (
                  <TextInput
                    id={id}
                    value={viceDiscord}
                    onChange={(e) => setViceDiscord(e.target.value)}
                    required
                  />
                )}
              </FormField>
              <FormField label="Vice Roblox" required>
                {(id) => (
                  <TextInput
                    id={id}
                    value={viceRoblox}
                    onChange={(e) => setViceRoblox(e.target.value)}
                    required
                  />
                )}
              </FormField>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex flex-col gap-4">
            <SectionHeader
              title="Roster"
              level={3}
              description={`Minimum ${MIN_ROSTER_SIZE} players, including captain & vice (rows 1–2).`}
            />

            <div className="flex flex-col gap-2">
              {roster.map((row, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <TextInput
                    size="sm"
                    placeholder={`Player ${index + 1} Discord`}
                    aria-label={`Player ${index + 1} Discord`}
                    value={row.discord}
                    onChange={(e) => updateRoster(index, 'discord', e.target.value)}
                    required
                  />
                  <TextInput
                    size="sm"
                    placeholder={`Player ${index + 1} Roblox`}
                    aria-label={`Player ${index + 1} Roblox`}
                    value={row.roblox}
                    onChange={(e) => updateRoster(index, 'roblox', e.target.value)}
                    required
                  />
                  {index >= MIN_ROSTER_SIZE ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-24"
                      onClick={() => setRoster((rows) => rows.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  ) : (
                    <span className="hidden w-24 sm:block" />
                  )}
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
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <LinkButton to="/teams/registrations" variant="outline">
            Cancel
          </LinkButton>
          <Button type="submit" loading={submitting} loadingLabel="Submitting…">
            Submit application
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
