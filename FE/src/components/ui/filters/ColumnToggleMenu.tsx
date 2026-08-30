/**
 * ColumnToggleMenu — the "which columns?" dropdown for a wide table: a checkbox per column plus a select-all row, opened from a trigger button.
 * The panel is portalled to `document.body` and positioned against the trigger's viewport rect, so it escapes the table's `overflow-x: auto` clipping; it closes on outside-click and on Escape.
 * Lives in `components/ui/filters/`; the caller owns the `visible` map, so column visibility can be persisted or reset alongside the page's other filter state.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import Button from '../buttons/Button'
import Checkbox from '../inputs/Checkbox'
import CountBadge from '../badges/CountBadge'

export interface ToggleableColumn {
  key: string
  label: string
}

interface Props {
  columns: readonly ToggleableColumn[]
  /** Column key → shown. The caller owns this map. */
  visible: Record<string, boolean>
  onToggle: (key: string) => void
  /** Called with the new value for every column when the select-all row is clicked. */
  onToggleAll: (nextValue: boolean) => void
  label?: string
  className?: string
}

export default function ColumnToggleMenu({
  columns,
  visible,
  onToggle,
  onToggleAll,
  label = 'Filter Stats',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const allVisible = columns.every((column) => visible[column.key])
  const visibleCount = columns.filter((column) => visible[column.key]).length

  const position = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setStyle({
      position: 'absolute',
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    position()

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [open, position])

  return (
    <>
      {/* The ref lives on a wrapper rather than the Button so the panel can be positioned
          without Button needing to forward a ref. */}
      <div ref={triggerRef} className={`inline-flex ${className}`}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {label}
          <CountBadge count={visibleCount} size="sm" color="accent" />
        </Button>
      </div>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            style={{ ...style, boxShadow: 'var(--shadow-lg)' }}
            className="z-50 flex max-h-96 w-80 flex-col overflow-hidden rounded-card border border-border bg-surface-elevated"
          >
            <div className="border-b border-border px-4 py-3">
              <Checkbox
                label="All stats"
                checked={allVisible}
                onChange={() => onToggleAll(!allVisible)}
              />
            </div>
            <div className="scrollbar-thin grid grid-cols-2 gap-2 overflow-y-auto p-4">
              {columns.map((column) => (
                <Checkbox
                  key={column.key}
                  label={column.label}
                  checked={Boolean(visible[column.key])}
                  onChange={() => onToggle(column.key)}
                />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
