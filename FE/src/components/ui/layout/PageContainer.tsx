/**
 * PageContainer — the outer shell every routed page renders into: fluid page padding, the shared max width, and a vertical rhythm between sections.
 * Props: `width` (`shell` for the full 2400px content width, `wide`, `narrow` for prose/forms), `padded` to opt out of the horizontal gutter, and `className` for a page-specific tweak.
 * Lives in `components/ui/layout/`; use it as the root element of a page instead of a bespoke `.xyz-page` wrapper class.
 */
import type { ReactNode } from 'react'

type ContainerWidth = 'shell' | 'wide' | 'narrow'

interface Props {
  children: ReactNode
  width?: ContainerWidth
  padded?: boolean
  className?: string
}

const WIDTH_CLASSES: Record<ContainerWidth, string> = {
  /** Full app content width — listing tables and dashboards that benefit from ultrawide. */
  shell:  'max-w-shell',
  /** Detail pages and card grids, where a 2400px line length would be unreadable. */
  wide:   'max-w-[1400px]',
  /** Prose, forms and auth screens. */
  narrow: 'max-w-[720px]',
}

export default function PageContainer({ children, width = 'shell', padded = true, className = '' }: Props) {
  return (
    <div className={`mx-auto w-full flex flex-col gap-section ${WIDTH_CLASSES[width]} ${padded ? 'px-page py-page' : ''} ${className}`}>
      {children}
    </div>
  )
}
