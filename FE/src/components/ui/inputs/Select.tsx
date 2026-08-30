/**
 * Select — the native `<select>` in the app's control chrome, taking its options as an `options` array rather than as children so a caller never hand-writes `<option>` markup.
 * `placeholder` becomes the empty-value option (the "All seasons" / "Any position" row on filter bars); `invalid` and `size` match TextInput exactly, since the two sit side by side on every form.
 * Lives in `components/ui/inputs/`; for a filter-bar select, `filters/FilterSelect` wraps this with its own label treatment.
 */
import type { SelectHTMLAttributes } from 'react'
import { CONTROL_BASE, CONTROL_SIZE_CLASSES, controlBorder } from './TextInput'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'> {
  options: readonly SelectOption[]
  /** Label for the empty-string option rendered first. Omit for a select with no empty state. */
  placeholder?: string
  invalid?: boolean
  size?: 'sm' | 'md'
}

export default function Select({
  options,
  placeholder,
  invalid = false,
  size = 'md',
  className = '',
  ...props
}: Props) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={`${CONTROL_BASE} ${CONTROL_SIZE_CLASSES[size]} ${controlBorder(invalid)} cursor-pointer pr-8 ${className}`}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/** Builds `SelectOption[]` from a plain list — for the many filters whose value and label
 *  are the same string (positions, award types, stages). */
export function toOptions(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }))
}
