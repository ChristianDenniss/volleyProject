/**
 * teamsNav — the sibling-page link set shared by the three team views (the league roster,
 * the registration list, and the registration form).
 *
 * Declared once here rather than repeated in each page so the three stay in sync: adding a
 * fourth team view is one entry, not three edits. Consumed by `ui/navigation/SubNav`.
 */
import type { SubNavItem } from '@/components/ui/navigation/SubNav'

export const TEAMS_NAV_ITEMS: SubNavItem[] = [
  { label: 'League teams', to: '/teams' },
  { label: 'Team registrations', to: '/teams/registrations' },
  { label: 'Register a team', to: '/teams/register' },
]
