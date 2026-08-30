/**
 * ErrorNotice — the standard inline error panel for a failed fetch or a rejected form submission, with an optional retry action.
 * `tone` picks the severity treatment (`danger` default, `warning` for a recoverable/partial problem, `info` for a neutral notice); `inline` renders a single tight line for use under a form field.
 * Lives in `components/ui/feedback/`; use it instead of `<div>Error: {error}</div>` so every failure in the app reads the same way.
 */
import type { ReactNode } from 'react'
import { FaExclamationCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'

type NoticeTone = 'danger' | 'warning' | 'info'

interface Props {
  /** The message to show. An `Error` or an unknown thrown value is narrowed to its message. */
  message: ReactNode
  title?: string
  tone?: NoticeTone
  action?: ReactNode
  /** Single-line, borderless treatment for field-level validation text. */
  inline?: boolean
  className?: string
}

const TONE_CLASSES: Record<NoticeTone, string> = {
  danger:  'bg-status-danger/8 border-status-danger/30 text-status-danger',
  warning: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
  info:    'bg-status-info/10 border-status-info/30 text-status-info',
}

/** Text-only colors for the `inline` variant, which has no fill or border to carry the tone. */
const TONE_TEXT_CLASSES: Record<NoticeTone, string> = {
  danger:  'text-status-danger',
  warning: 'text-status-warning',
  info:    'text-status-info',
}

const TONE_ICONS: Record<NoticeTone, ReactNode> = {
  danger:  <FaExclamationCircle aria-hidden />,
  warning: <FaExclamationTriangle aria-hidden />,
  info:    <FaInfoCircle aria-hidden />,
}

export default function ErrorNotice({
  message,
  title,
  tone = 'danger',
  action,
  inline = false,
  className = '',
}: Props) {
  if (inline) {
    return (
      <p role="alert" className={`m-0 flex items-center gap-1.5 text-xs ${TONE_TEXT_CLASSES[tone]} ${className}`}>
        {TONE_ICONS[tone]}
        {message}
      </p>
    )
  }

  return (
    <div
      role="alert"
      className={`flex flex-wrap items-start gap-3 rounded-card border p-4 ${TONE_CLASSES[tone]} ${className}`}
    >
      <span className="mt-0.5 shrink-0 text-base">{TONE_ICONS[tone]}</span>
      <div className="min-w-0 flex-1 flex flex-col gap-1">
        {title && <p className="m-0 text-sm font-semibold">{title}</p>}
        <p className="m-0 text-sm break-words">{message}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Narrows an unknown caught value to a displayable message. Use at the boundary so
 *  pages never render `[object Object]` from a rejected promise. */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (typeof error === 'string') return error || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}
