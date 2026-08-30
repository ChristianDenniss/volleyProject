/**
 * TextInput — the single-line text/email/password/number/date input, plus `TextArea` for the multi-line case, sharing one control style.
 * Both take `invalid` (draws the danger border), `size`, and an optional leading `icon`; every other native attribute is forwarded, so `type`, `min`, `autoComplete` and friends work as usual.
 * Lives in `components/ui/inputs/`; wrap in `FormField` for the label, hint and error message rather than rendering a bare `<label>` next to one.
 */
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type ControlSize = 'sm' | 'md'

/** The shared control chrome — border, radius, focus ring, disabled treatment. Kept as one
 *  constant so an input, a textarea and a select can never drift apart visually. */
export const CONTROL_BASE =
  'w-full rounded-control border bg-surface text-content placeholder:text-content-muted transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-surface-inset disabled:opacity-60'

export const CONTROL_SIZE_CLASSES: Record<ControlSize, string> = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-sm',
}

/** Border color is the only thing the invalid state changes — the layout must not shift. */
export const controlBorder = (invalid?: boolean) =>
  invalid ? 'border-status-danger' : 'border-border'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean
  size?: ControlSize
  /** Rendered inside the field's left edge; the input is padded to clear it. */
  icon?: ReactNode
}

export default function TextInput({
  invalid = false,
  size = 'md',
  icon,
  className = '',
  ...props
}: TextInputProps) {
  const input = (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${CONTROL_BASE} ${CONTROL_SIZE_CLASSES[size]} ${controlBorder(invalid)} ${icon ? 'pl-9' : ''} ${className}`}
    />
  )

  if (!icon) return input

  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
        {icon}
      </span>
      {input}
    </div>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function TextArea({ invalid = false, rows = 4, className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`${CONTROL_BASE} ${controlBorder(invalid)} resize-y px-3 py-2 text-sm leading-relaxed ${className}`}
    />
  )
}
