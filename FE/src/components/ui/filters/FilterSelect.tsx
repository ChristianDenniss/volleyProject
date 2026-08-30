/**
 * FilterSelect — a compact labelled `<select>` sized for a filter bar, where the label is the accessible name and the "all" option is the placeholder.
 * Thin wrapper over `inputs/Select` that fixes the size to `sm`, constrains the width, and marks itself active (accent border) whenever a value is selected, so an applied filter is visible at a glance.
 * Lives in `components/ui/filters/`; use `inputs/Select` instead when the control is part of a form rather than a filter bar.
 */
import Select, { type SelectOption } from '../inputs/Select'

interface Props {
  /** Accessible name — filter bars are too tight for a visible label. */
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
  /** The "no filter" option's label, e.g. "All seasons". */
  placeholder: string
  disabled?: boolean
  className?: string
}

export default function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
}: Props) {
  return (
    <Select
      aria-label={label}
      title={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      placeholder={placeholder}
      size="sm"
      className={`w-auto min-w-[9rem] max-w-[14rem] ${value ? 'border-accent text-accent' : ''} ${className}`}
    />
  )
}
