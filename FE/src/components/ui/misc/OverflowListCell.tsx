/**
 * OverflowListCell — a table cell that shows the first few items of a list inline and collapses the rest behind a "+N" trigger, which opens a portalled popover with the full list.
 * The popover is positioned against the trigger's viewport rect and repositions on scroll/resize, so it escapes the table's `overflow-x: auto` clipping instead of being cut off.
 * Lives in `components/ui/misc/`; use it for any many-valued cell (teams, seasons, awards) rather than truncating with CSS and losing the values.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

interface Props {
  items: string[]
  separator?: string
  /** How many items to show inline before the "+N" trigger. */
  maxVisible?: number
  emptyLabel?: ReactNode
  popoverTitle?: string
  className?: string
}

export default function OverflowListCell({
  items,
  separator = ', ',
  maxVisible = 2,
  emptyLabel = '—',
  popoverTitle,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  const hiddenCount = Math.max(0, items.length - maxVisible)
  const visibleText = (hiddenCount > 0 ? items.slice(0, maxVisible) : items).join(separator)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    setPopoverStyle({
      left: rect.left + rect.width / 2,
      bottom: window.innerHeight - rect.top + 8,
    })
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const toggleOpen = (event: ReactMouseEvent) => {
    event.stopPropagation()
    if (hiddenCount === 0) return

    if (!open) {
      updatePosition()
      setOpen(true)
      return
    }
    close()
  }

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      close()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const handleReposition = () => updatePosition()

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open, close, updatePosition])

  if (items.length === 0) {
    return <span className={`text-content-muted ${className}`}>{emptyLabel}</span>
  }

  return (
    <span
      className={`inline-flex min-w-0 items-baseline gap-1 ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="min-w-0 truncate">{visibleText}</span>
      {hiddenCount > 0 && (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          aria-expanded={open}
          aria-controls={popoverId}
          aria-label={`Show ${hiddenCount} more item${hiddenCount === 1 ? '' : 's'}`}
          className="shrink-0 cursor-pointer rounded-full border border-brand-muted bg-brand-subtle px-1.5 text-[0.6875rem] font-semibold text-accent transition-colors hover:bg-brand-muted"
        >
          +{hiddenCount}
        </button>
      )}

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="tooltip"
            style={{ ...popoverStyle, boxShadow: 'var(--shadow-lg)' }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="fixed z-50 max-h-64 min-w-40 max-w-72 -translate-x-1/2 overflow-y-auto rounded-card border border-border bg-surface-elevated p-3"
          >
            {popoverTitle && (
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-content-tertiary">
                {popoverTitle}
              </div>
            )}
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-content-secondary">
              {items.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </span>
  )
}
