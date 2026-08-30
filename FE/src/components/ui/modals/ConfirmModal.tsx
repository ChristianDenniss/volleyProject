/**
 * ConfirmModal — the yes/no dialog for an action that needs a deliberate confirmation (deleting a team, denying a registration, discarding an edit).
 * Wraps `Modal` with a message body and a Cancel/Confirm footer; `tone` picks the confirm button's variant so a destructive action reads red and a routine one reads primary, and `loading` disables both buttons while the action runs.
 * Lives in `components/ui/modals/`; use it instead of `window.confirm()` or a hand-built dialog.
 */
import type { ReactNode } from 'react'
import Button, { type ButtonVariant } from '../buttons/Button'
import Modal from './Modal'

type ConfirmTone = 'danger' | 'primary' | 'warning'

const CONFIRM_VARIANT: Record<ConfirmTone, ButtonVariant> = {
  danger: 'danger-filled',
  primary: 'primary',
  warning: 'warning',
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  /** The consequence, stated plainly. Name the thing being acted on. */
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      dismissOnBackdrop={!loading}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={CONFIRM_VARIANT[tone]}
            onClick={onConfirm}
            loading={loading}
            loadingLabel="Working…"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="m-0 text-sm leading-relaxed text-content-secondary">{message}</p>
    </Modal>
  )
}
