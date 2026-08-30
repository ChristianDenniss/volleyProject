/**
 * PlacementBadge — the medal chip for a finishing position: 1st gold, 2nd silver, 3rd bronze, everything else neutral.
 * Takes a numeric `place` (1-based) and renders an ordinal label, or a trophy glyph when `iconOnly`; `size` controls the chip scale.
 * Lives in `components/ui/badges/`; used by records, awards, standings and season summaries so a podium color is never picked ad hoc.
 */
import { FaTrophy } from 'react-icons/fa'

type PlacementSize = 'sm' | 'md' | 'lg'

interface Props {
  place: number
  iconOnly?: boolean
  size?: PlacementSize
  className?: string
}

/** Only the podium gets a color — 4th and below are deliberately neutral so a long
 *  standings table doesn't read as if every row were an achievement. */
const PLACE_CLASSES: Record<number, string> = {
  1: 'bg-status-gold/20 text-status-gold border-status-gold/40',
  2: 'bg-status-silver/20 text-status-silver border-status-silver/40',
  3: 'bg-status-bronze/15 text-status-bronze border-status-bronze/30',
}

const NEUTRAL = 'bg-surface-inset text-content-tertiary border-border'

const SIZE_CLASSES: Record<PlacementSize, string> = {
  sm: 'text-[0.6875rem] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th". */
export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

export default function PlacementBadge({ place, iconOnly = false, size = 'md', className = '' }: Props) {
  const label = ordinal(place)
  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${SIZE_CLASSES[size]} ${PLACE_CLASSES[place] ?? NEUTRAL} ${className}`}
    >
      {place <= 3 && <FaTrophy aria-hidden />}
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </span>
  )
}
