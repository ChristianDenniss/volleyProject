/**
 * Accordion — a list of expand/collapse disclosure rows driven by an `items` array of `{ id, title, content }`.
 * `allowMultiple` (the default) lets any number of rows sit open at once; set it false for a one-at-a-time accordion. Open state is held internally unless `openIds` and `onToggle` are supplied.
 * Lives in `components/ui/misc/`; use it instead of hand-rolling a button + conditional panel per row.
 */
import { useState, type ReactNode } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

export interface AccordionItem {
  id: string
  title: ReactNode
  content: ReactNode
}

interface Props {
  items: AccordionItem[]
  /** Allow several rows open simultaneously. Default true. */
  allowMultiple?: boolean
  /** Controlled open set. Pair with `onToggle`; omit both to let the component own the state. */
  openIds?: Set<string>
  onToggle?: (id: string) => void
  className?: string
}

export default function Accordion({
  items,
  allowMultiple = true,
  openIds,
  onToggle,
  className = '',
}: Props) {
  const [internalOpen, setInternalOpen] = useState<Set<string>>(new Set())
  const open = openIds ?? internalOpen

  const toggle = (id: string) => {
    if (onToggle) {
      onToggle(id)
      return
    }
    setInternalOpen((current) => {
      const next = allowMultiple ? new Set(current) : new Set<string>()
      if (current.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {items.map((item) => {
        const isOpen = open.has(item.id)
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-card border border-border bg-surface"
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-content transition-colors hover:bg-surface-inset"
            >
              <span className="min-w-0">{item.title}</span>
              <span aria-hidden className="shrink-0 text-content-tertiary">
                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </button>

            {isOpen && (
              <div
                id={`accordion-panel-${item.id}`}
                className="border-t border-border px-4 py-3 text-sm leading-relaxed text-content-secondary"
              >
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
