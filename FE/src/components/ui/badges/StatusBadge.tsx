/**
 * StatusBadge — an icon + label pill representing a registration, application, game or season status (pending, accepted, denied, conflict, scheduled, completed, active, open, closed, …).
 * Looks the `status` string up in a config map for its semantic color, icon and display label, falling back to a neutral badge for an unknown value; pass `iconOnly` to drop the label for tight table cells.
 * Lives in `components/ui/badges/`; use it anywhere a status needs a colored chip instead of writing a `<span>` with a status class.
 */
import type { ReactNode } from 'react'
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaExclamationTriangle,
  FaPlay,
  FaBan,
  FaLock,
  FaLockOpen,
  FaRegCircle,
} from 'react-icons/fa'

interface Config {
  className: string
  icon: ReactNode
  label: string
}

/** Every status the app renders, keyed by the raw API value. Add new statuses here —
 *  never by branching on the status string at a call site. */
const BADGE_CONFIG: Record<string, Config> = {
  /* Team registration */
  pending:  { className: 'bg-status-warning/15 text-status-warning border-status-warning/30', icon: <FaClock />, label: 'Pending' },
  conflict: { className: 'bg-status-orange/15 text-status-orange border-status-orange/30', icon: <FaExclamationTriangle />, label: 'Conflict' },
  accepted: { className: 'bg-status-success/15 text-status-success border-status-success/30', icon: <FaCheck />, label: 'Accepted' },
  denied:   { className: 'bg-status-danger/15 text-status-danger border-status-danger/30', icon: <FaTimes />, label: 'Denied' },

  /* Applications */
  approved: { className: 'bg-status-success/15 text-status-success border-status-success/30', icon: <FaCheck />, label: 'Approved' },
  rejected: { className: 'bg-status-danger/15 text-status-danger border-status-danger/30', icon: <FaTimes />, label: 'Rejected' },

  /* Games / seasons */
  scheduled: { className: 'bg-status-info/15 text-status-info border-status-info/30', icon: <FaClock />, label: 'Scheduled' },
  in_progress: { className: 'bg-status-running/15 text-status-running border-status-running/30', icon: <FaPlay />, label: 'In Progress' },
  completed: { className: 'bg-status-success/15 text-status-success border-status-success/30', icon: <FaCheck />, label: 'Completed' },
  cancelled: { className: 'bg-status-danger/15 text-status-danger border-status-danger/30', icon: <FaBan />, label: 'Cancelled' },
  active:    { className: 'bg-status-success/15 text-status-success border-status-success/30', icon: <FaRegCircle />, label: 'Active' },
  inactive:  { className: 'bg-surface-inset text-content-tertiary border-border', icon: <FaRegCircle />, label: 'Inactive' },
  open:      { className: 'bg-status-success/15 text-status-success border-status-success/30', icon: <FaLockOpen />, label: 'Open' },
  closed:    { className: 'bg-surface-inset text-content-tertiary border-border', icon: <FaLock />, label: 'Closed' },

  /* Match outcome */
  won:  { className: 'bg-status-success/15 text-status-success border-status-success/30', icon: <FaCheck />, label: 'Won' },
  lost: { className: 'bg-status-danger/15 text-status-danger border-status-danger/30', icon: <FaTimes />, label: 'Lost' },
}

const FALLBACK: Omit<Config, 'label'> = {
  className: 'bg-surface-inset text-content-muted border-border',
  icon: null,
}

interface Props {
  status: string
  /** Hide the text label; keep the icon and expose the label via title + visually-hidden text. */
  iconOnly?: boolean
  /** Override the config map's label without changing its color (e.g. "Awaiting review" for `pending`). */
  label?: string
  className?: string
}

export default function StatusBadge({ status, iconOnly = false, label, className = '' }: Props) {
  const config = BADGE_CONFIG[status] ?? { ...FALLBACK, label: status }
  const text = label ?? config.label

  return (
    <span
      title={text}
      className={`inline-flex items-center justify-center rounded-full border text-xs font-semibold whitespace-nowrap ${iconOnly ? 'h-6 w-6 p-0' : 'gap-1.5 px-2.5 py-1'} ${config.className} ${className}`}
    >
      {config.icon}
      {iconOnly ? <span className="sr-only">{text}</span> : text}
    </span>
  )
}

/** The statuses the config map knows about — for building filter dropdowns without
 *  re-listing them at the call site. */
export const KNOWN_STATUSES = Object.keys(BADGE_CONFIG)
