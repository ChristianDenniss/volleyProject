/**
 * Checkbox — a native checkbox with its label, sized and colored from the token set, plus `Radio` for the single-choice case.
 * Both render the control and its label as one clickable row with a consistent hit area; `description` adds a second muted line under the label for an option that needs explaining.
 * Lives in `components/ui/inputs/`; use these instead of a bare `<input type="checkbox">` next to a `<span>`.
 */
import type { InputHTMLAttributes, ReactNode } from 'react'

const CONTROL_CLASSES =
  'h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-50'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

export default function Checkbox({ label, description, className = '', ...props }: Props) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 ${props.disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}>
      <input type="checkbox" {...props} className={`${CONTROL_CLASSES} mt-0.5`} />
      <span className="min-w-0 flex flex-col gap-0.5">
        <span className="text-sm text-content">{label}</span>
        {description && <span className="text-xs text-content-muted">{description}</span>}
      </span>
    </label>
  )
}

export function Radio({ label, description, className = '', ...props }: Props) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 ${props.disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}>
      <input type="radio" {...props} className={`${CONTROL_CLASSES} mt-0.5`} />
      <span className="min-w-0 flex flex-col gap-0.5">
        <span className="text-sm text-content">{label}</span>
        {description && <span className="text-xs text-content-muted">{description}</span>}
      </span>
    </label>
  )
}
