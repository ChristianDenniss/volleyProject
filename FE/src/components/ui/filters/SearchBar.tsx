/**
 * SearchBar — the text search control used above every list, with a magnifier affordance and a clear button that appears once there's a query.
 * It is controlled-optional: pass `value` to drive it from page state, or leave it uncontrolled and read the query from `onSearch`, which fires on every keystroke (debounce it in the page with `useDebouncedValue`).
 * Lives in `components/ui/filters/`; use it instead of a bare `<input type="text" placeholder="Search…">`.
 */
import { useState, type ChangeEvent } from 'react'
import { FaSearch, FaTimes } from 'react-icons/fa'
import { CONTROL_BASE, CONTROL_SIZE_CLASSES } from '../inputs/TextInput'

interface Props {
  onSearch: (query: string) => void
  /** Controlled value. Omit to let the component hold its own state. */
  value?: string
  placeholder?: string
  size?: 'sm' | 'md'
  className?: string
}

export default function SearchBar({
  onSearch,
  value,
  placeholder = 'Search…',
  size = 'md',
  className = '',
}: Props) {
  const [internal, setInternal] = useState('')
  const query = value ?? internal

  const update = (next: string) => {
    if (value === undefined) setInternal(next)
    onSearch(next)
  }

  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <FaSearch
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
      />
      <input
        type="search"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => update(e.target.value)}
        className={`${CONTROL_BASE} ${CONTROL_SIZE_CLASSES[size]} border-border pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => update('')}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-content-muted transition-colors hover:bg-surface-inset hover:text-content"
        >
          <FaTimes aria-hidden />
        </button>
      )}
    </div>
  )
}
