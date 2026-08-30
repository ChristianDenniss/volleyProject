/**
 * FormField — the label/control/help/error wrapper every form input sits inside, owning the `<label for>` wiring and the error state so no control has to.
 * Pass `label`, an optional `hint`, an optional `error`, and the control as children; it generates an id when one isn't supplied and hands it down via the `renderControl` callback or a plain `htmlFor`.
 * Lives in `components/ui/inputs/`; use it around every input so labels, required markers and validation messages are positioned identically across the app.
 */
import { useId, type ReactNode } from 'react'
import ErrorNotice from '../feedback/ErrorNotice'

interface Props {
  label: ReactNode
  /** Explicit control id. Omit and one is generated. */
  htmlFor?: string
  required?: boolean
  /** Helper text shown below the control when there's no error. */
  hint?: ReactNode
  /** Validation message. Replaces `hint` and marks the field invalid. */
  error?: string | null
  /** Receives the resolved control id — use it to wire a control that isn't a child. */
  children: ReactNode | ((id: string) => ReactNode)
  className?: string
}

export default function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className = '',
}: Props) {
  const generatedId = useId()
  const id = htmlFor ?? generatedId

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-content-secondary">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-status-danger">
            *
          </span>
        )}
      </label>

      {typeof children === 'function' ? children(id) : children}

      {error ? (
        <ErrorNotice message={error} inline />
      ) : (
        hint && <p className="m-0 text-xs text-content-muted">{hint}</p>
      )}
    </div>
  )
}
