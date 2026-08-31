import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

export function usePortalDropdown(estimatedHeight: number, minWidth = 160, closeOnScroll = true) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  // HTMLElement (not HTMLButtonElement) - only getBoundingClientRect()/contains() are used
  // below, both available on any element, so this also works attached to an <input> (e.g.
  // the version autocomplete's suggestions dropdown), not just the original <button> triggers.
  const triggerRef = useRef<HTMLElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect       = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const clampedH   = Math.min(estimatedHeight, 300)
    const openUpward = spaceBelow < clampedH + 8 && rect.top > clampedH + 8
    const margin     = 8
    const width      = Math.max(rect.width, minWidth)
    const left       = Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin)
    const style: CSSProperties = {
      position:  'fixed',
      top:       openUpward ? rect.top - clampedH - 4 : rect.bottom + 4,
      left,
      width,
      maxHeight: Math.min(clampedH, openUpward ? rect.top - 8 : spaceBelow - 8),
      zIndex:    9999,
    }
    // Write straight to the node first - during scroll this lands in the same frame as the
    // event, ahead of React's re-render, so the panel tracks the trigger instead of lagging
    // a frame behind (which reads as a jump/stutter on fast or inertial scrolling).
    if (dropdownRef.current) {
      dropdownRef.current.style.top       = `${style.top}px`
      dropdownRef.current.style.left      = `${style.left}px`
      dropdownRef.current.style.width     = `${style.width}px`
      dropdownRef.current.style.maxHeight = `${style.maxHeight}px`
    }
    setDropdownStyle(style)
  }, [estimatedHeight, minWidth])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onMouse = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    const onKey    = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return
      if (closeOnScroll) { setOpen(false); return }
      updatePosition()
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, closeOnScroll, updatePosition])

  return { open, setOpen, dropdownStyle, triggerRef, dropdownRef }
}
