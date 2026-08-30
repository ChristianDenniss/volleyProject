/**
 * RegStatusBadge — the status chip for a team registration (pending, conflict, accepted, denied), and `REGISTRATION_STATUSES`, the ordered list the legend and filter controls render from.
 * It is a thin wrapper over `StatusBadge`, which already owns the color and icon for each of these four values — this file exists so the registration views import a domain-typed component rather than passing a loose string.
 * Lives in `components/ui/badges/`; used by the registrations list, the registration detail page and the portal's registrations hub.
 */
import type { TeamRegistrationStatus } from '@/types/interfaces'
import StatusBadge from './StatusBadge'

/** Display order for the legend — the lifecycle, not alphabetical. */
export const REGISTRATION_STATUSES: TeamRegistrationStatus[] = [
  'pending',
  'conflict',
  'accepted',
  'denied',
]

interface Props {
  status: TeamRegistrationStatus
  className?: string
}

export function RegStatusBadge({ status, className }: Props) {
  return <StatusBadge status={status} className={className} />
}

export default RegStatusBadge
