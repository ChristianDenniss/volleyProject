/**
 * Avatar — a player/team/user image with a deterministic initials fallback, used in rosters, tables, comment bylines and profile headers.
 * When `src` is missing or fails to load it draws the initials on a brand-tinted circle instead of a broken image; `size` and `shape` (circle for people, rounded square for teams) cover every current use.
 * Lives in `components/ui/misc/`; use it rather than an `<img>` with per-page sizing, so a missing avatar never collapses a row's height.
 */
import { useState } from 'react'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarShape = 'circle' | 'square'

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[0.625rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

const SHAPE_CLASSES: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-card',
}

interface Props {
  /** Image URL. Falls back to initials when absent or when loading fails. */
  src?: string | null
  /** Used for the alt text and to derive the initials fallback. */
  name: string
  size?: AvatarSize
  shape?: AvatarShape
  className?: string
}

/** "Sam Hall" → "SH", "libero" → "LI". Two characters, always. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ src, name, size = 'md', shape = 'circle', className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const base = `shrink-0 overflow-hidden ${SIZE_CLASSES[size]} ${SHAPE_CLASSES[shape]} ${className}`

  if (!src || failed) {
    return (
      <span
        aria-label={name}
        title={name}
        className={`inline-flex items-center justify-center border border-brand-muted bg-brand-subtle font-semibold text-accent ${base}`}
      >
        {initialsOf(name)}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      title={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`border border-border bg-surface-inset object-cover ${base}`}
    />
  )
}
