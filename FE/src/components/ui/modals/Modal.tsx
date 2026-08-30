/**
 * Modal — the base dialog shell every concrete modal is built on: a scrim, a centered panel, a titled header with a close button, a scrolling body and an optional footer for actions.
 * Handles Escape-to-close, click-outside-to-close (opt out with `dismissOnBackdrop={false}`) and body scroll-locking while open; `size` picks the panel width.
 * Lives in `components/ui/modals/`; compose it rather than building a new overlay — `ConfirmModal` is the ready-made yes/no variant.
 */
import { useEffect, type ReactNode } from 'react'
import IconButton from '../buttons/IconButton'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

interface Props {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Right-aligned action row pinned below the scrolling body. */
  footer?: ReactNode
  size?: ModalSize
  /** Set false for a destructive/blocking dialog that must be dismissed deliberately. */
  dismissOnBackdrop?: boolean
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  dismissOnBackdrop = true,
  className = '',
}: Props) {
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Lock background scroll so the page behind doesn't move under the scrim.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={dismissOnBackdrop ? onClose : undefined}
      style={{ background: 'var(--color-overlay)' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fade-in_120ms_ease-out]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: 'var(--shadow-modal)' }}
        className={`flex max-h-[90vh] w-full flex-col rounded-panel bg-surface-elevated ${SIZE_CLASSES[size]} ${className}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="m-0 min-w-0 truncate text-lg font-semibold text-content">{title}</h2>
          <IconButton icon={<span aria-hidden className="text-xl leading-none">&times;</span>} label="Close" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
