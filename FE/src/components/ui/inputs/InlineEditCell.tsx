/**
 * InlineEditCell — a table cell that turns into an editable control on click and commits on blur or Enter, reverting on Escape; the click-to-edit control every admin-portal table uses.
 * `type` picks the control — `text`/`number`/`url`/`date` render an input, and passing `options` renders a select instead — so a column editing an enum or a date doesn't need its own component.
 * It owns only the *editing* interaction: the caller keeps the value and decides what a commit means, receiving the new value through `onCommit` (which may be async, or may stage a confirmation).
 * Lives in `components/ui/inputs/`; it replaces the hand-rolled `editing?.id === row.id && editing.field === 'name'` blocks each portal page used to repeat per column.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CONTROL_BASE, CONTROL_SIZE_CLASSES } from './TextInput'
import type { SelectOption } from './Select'

type EditType = 'text' | 'number' | 'url' | 'date'

interface Props {
  /** The committed value. Also seeds the control when editing starts. */
  value: string
  /** Called with the trimmed new value when the user commits. No-op if unchanged. */
  onCommit: (next: string) => void | Promise<void>
  /** Input type. Ignored when `options` is provided. */
  type?: EditType
  /** Renders a `<select>` instead of an input — for a column whose values are a closed set. */
  options?: readonly SelectOption[]
  /** Rendered when not editing and the value is empty. */
  placeholder?: string
  /** Overrides the read-mode rendering — for a value that displays as a pill, image or link. */
  display?: ReactNode
  disabled?: boolean
  /** Accessible name for the control; defaults to "Edit value". */
  label?: string
  className?: string
}

export default function InlineEditCell({
  value,
  onCommit,
  type = 'text',
  options,
  placeholder = '—',
  display,
  disabled = false,
  label = 'Edit value',
  className = '',
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const controlRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  // Re-seed the draft whenever editing opens, so a cancelled edit doesn't leak into the next one.
  useEffect(() => {
    if (!editing) return
    setDraft(value)
    controlRef.current?.focus()
  }, [editing, value])

  const commit = (next = draft) => {
    setEditing(false)
    const trimmed = next.trim()
    if (trimmed === value) return
    void onCommit(trimmed)
  }

  if (disabled) {
    return <span className={className}>{display ?? value ?? placeholder}</span>
  }

  if (editing) {
    const controlClasses = `${CONTROL_BASE} ${CONTROL_SIZE_CLASSES.sm} border-accent ${className}`

    if (options) {
      return (
        <select
          ref={controlRef as React.RefObject<HTMLSelectElement>}
          aria-label={label}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            commit(e.target.value)
          }}
          onBlur={() => commit()}
          className={`${controlClasses} cursor-pointer`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        ref={controlRef as React.RefObject<HTMLInputElement>}
        type={type}
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        className={controlClasses}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`w-full cursor-text rounded-control px-1.5 py-1 text-left transition-colors hover:bg-surface-inset ${className}`}
    >
      {display ?? value ?? <span className="text-content-muted">{placeholder}</span>}
    </button>
  )
}
