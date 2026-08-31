/**
 * FilterSelect — multi-value include/exclude filter dropdown: each option has include (✓) and exclude (✗) toggles, plus a select-all/clear header and an active-count trigger; options may carry a user `avatar` or a `dotColorClass` swatch.
 * Props: `icon`, `placeholder`, `value: FilterValue`, `onChange`, `options`, `className?`, `disabled?`; also exports `FilterValue`, `EMPTY_FILTER`, `isFilterActive`, and `matchesFilter`.
 * Lives in `components/filters/`; the standard filter control across list/table pages.
 *
 * ── Copied from troj-model-dashboard, unwired ────────────────────────────────
 * Two deviations from the original, both forced by this project's dependencies:
 *
 *   1. Icons come from `react-icons/lu` rather than `lucide-react`. react-icons'
 *      `lu` set IS Lucide, and react-icons is already a dependency here, so the
 *      glyphs are identical and no package was added. Aliased on import so the
 *      JSX below is unchanged from the original.
 *
 *   2. The semantic colour classes it is written against do not exist in this
 *      project's Tailwind theme yet - surface, content-*, border-strong,
 *      status-success, status-danger, accent, on-accent, scrollbar-thin. Until
 *      those are registered in tailwind.css (or the classes are remapped onto
 *      the tokens in tokens.css), this renders with correct layout and no
 *      colour. Nothing imports it yet, so that costs nothing today.
 */
import { createPortal } from 'react-dom'
import { LuChevronDown as ChevronDown, LuCheck as Check, LuX as X } from 'react-icons/lu'
import type { ReactElement, RefObject } from 'react'
import { usePortalDropdown } from '@/hooks/utils/usePortalDropdown'
import UserAvatar from '@/components/brand/UserAvatar'

export interface FilterSelectOption {
  label: string
  value: string
  avatar?: { url: string | null; name: string }
  /** Tailwind bg-* class for a small color swatch shown before the label (e.g. 'bg-status-success'). */
  dotColorClass?: string
}

export interface FilterValue {
  includes: string[]
  excludes: string[]
}

export const EMPTY_FILTER: FilterValue = { includes: [], excludes: [] }

export function isFilterActive(f: FilterValue): boolean {
  return f.includes.length > 0 || f.excludes.length > 0
}

export function matchesFilter(value: string | null | undefined, filter: FilterValue): boolean {
  if (!isFilterActive(filter)) return true
  const v = value ?? ''
  if (filter.excludes.includes(v)) return false
  if (filter.includes.length > 0 && !filter.includes.includes(v)) return false
  return true
}

/** Multi-valued sibling of matchesFilter, for a field that holds an array of tags rather than
 * one value (e.g. a doc's `area` list): excludes win if ANY tag is excluded, includes need only
 * one match. */
export function matchesTagsFilter(tags: string[], filter: FilterValue): boolean {
  if (!isFilterActive(filter)) return true
  if (tags.some(t => filter.excludes.includes(t))) return false
  if (filter.includes.length > 0 && !tags.some(t => filter.includes.includes(t))) return false
  return true
}

interface Props {
  icon: ReactElement
  placeholder: string
  value: FilterValue
  onChange: (value: FilterValue) => void
  options: FilterSelectOption[]
  className?: string
  disabled?: boolean
}

// Select All / Clear header row (~32px) + its border/margin, plus the list's own vertical padding.
const HEADER_HEIGHT      = 40
const ITEM_HEIGHT         = 36
const MAX_VISIBLE_ITEMS  = 8

export default function FilterSelect({ icon, placeholder, value, onChange, options, className = 'w-44', disabled = false }: Props) {
  const visibleItems = Math.min(options.length, MAX_VISIBLE_ITEMS)
  const { open, setOpen, dropdownStyle, triggerRef, dropdownRef } = usePortalDropdown(HEADER_HEIGHT + visibleItems * ITEM_HEIGHT, 160, false)

  const active = isFilterActive(value)


  function toggleInclude(opt: string) {
    const already = value.includes.includes(opt)
    onChange({
      includes: already ? value.includes.filter(v => v !== opt) : [...value.includes, opt],
      excludes: value.excludes.filter(v => v !== opt),
    })
  }

  function toggleExclude(opt: string) {
    const already = value.excludes.includes(opt)
    onChange({
      includes: value.includes.filter(v => v !== opt),
      excludes: already ? value.excludes.filter(v => v !== opt) : [...value.excludes, opt],
    })
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(EMPTY_FILTER)
    setOpen(false)
  }

  return (
    <div className={`relative shrink-0 ${className}`}>

      {/* Trigger */}
      <button
        ref={triggerRef as RefObject<HTMLButtonElement>}
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        className={`relative w-full inline-flex items-center h-8 min-h-8 px-2 gap-1.5 rounded-md border border-border-strong bg-surface shadow-sm transition-colors outline-none text-left ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-inset'}`}
      >
        <span className="shrink-0 text-content-muted flex items-center">{icon}</span>
        {active ? (
          <span className="flex-1 flex items-center gap-2 pr-4">
            {value.includes.length > 0 && (
              <span className="inline-flex items-center gap-0.5 leading-none text-status-success/70">
                <Check size={10} strokeWidth={2.5} className="shrink-0" />
                <span className="w-[3ch] text-xs font-medium tabular-nums text-center">{value.includes.length}</span>
              </span>
            )}
            {value.excludes.length > 0 && (
              <span className="inline-flex items-center gap-0.5 leading-none text-status-danger/70">
                <X size={10} strokeWidth={2.5} className="shrink-0" />
                <span className="w-[3ch] text-xs font-medium tabular-nums text-center">{value.excludes.length}</span>
              </span>
            )}
          </span>
        ) : (
          <span className="flex-1 text-xs truncate pr-4 text-content-muted">
            {placeholder}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`absolute right-2 text-content-muted transition-transform duration-150 ease ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Clear all */}
      {active && (
        <button
          type="button"
          tabIndex={-1}
          onClick={clearAll}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-0.5 text-content-muted hover:text-content-secondary transition-colors rounded-full cursor-pointer"
        >
          <X size={11} />
        </button>
      )}

      {/* Dropdown — stays open during multi-select; closes on outside click via usePortalDropdown */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="scrollbar-thin rounded-lg border border-border bg-surface shadow-lg overflow-y-auto py-1"
        >
          {/* Select all / Clear row */}
          <div className="flex items-center gap-px px-2 pt-0.5 pb-1.5 border-b border-border mb-1">
            <button
              type="button"
              onClick={() => onChange({ includes: options.map(o => o.value), excludes: [] })}
              className="flex-1 text-[10px] text-content-muted hover:text-status-success hover:bg-status-success/10 transition-colors text-center py-0.5 rounded cursor-pointer"
            >
              Select All
            </button>
            <span className="w-px h-3 bg-border shrink-0" />
            <button
              type="button"
              onClick={() => onChange(EMPTY_FILTER)}
              className="flex-1 text-[10px] text-content-muted hover:text-content-secondary hover:bg-surface-inset transition-colors text-center py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          </div>
          {options.map(opt => {
            const included = value.includes.includes(opt.value)
            const excluded = value.excludes.includes(opt.value)
            return (
              <div
                key={opt.value}
                className="flex items-center px-3 py-1.5 gap-2"
              >
                {opt.avatar && (
                  <UserAvatar name={opt.avatar.name} avatarUrl={opt.avatar.url} size="sm" className="!w-5 !h-5 !text-[9px] shrink-0" />
                )}
                {opt.dotColorClass && (
                  <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotColorClass}`} />
                )}
                <span className={`flex-1 min-w-0 truncate text-xs select-none ${
                  included ? 'text-status-success font-medium'
                  : excluded ? 'text-status-danger font-medium'
                  : 'text-content-secondary'
                }`} title={opt.label}>
                  {opt.label}
                </span>

                <button
                  type="button"
                  title="Include"
                  onClick={() => toggleInclude(opt.value)}
                  className={[
                    'flex items-center justify-center w-5 h-5 rounded transition-colors border cursor-pointer',
                    included
                      ? 'bg-status-success/20 text-status-success border-status-success/30'
                      : 'text-content-muted hover:text-status-success hover:bg-status-success/10 border-border',
                  ].join(' ')}
                >
                  <Check size={11} />
                </button>

                <button
                  type="button"
                  title="Exclude"
                  onClick={() => toggleExclude(opt.value)}
                  className={[
                    'flex items-center justify-center w-5 h-5 rounded transition-colors border cursor-pointer',
                    excluded
                      ? 'bg-status-danger/20 text-status-danger border-status-danger/30'
                      : 'text-content-muted hover:text-status-danger hover:bg-status-danger/10 border-border',
                  ].join(' ')}
                >
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}
