import { useId, useRef } from 'react'
import { Modal } from './Modal.tsx'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  /** Text of the confirm button while the action runs. */
  pendingLabel: string
  isPending: boolean
  /** Message shown when the action failed; the dialog stays open to try again. */
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Asks for confirmation before a destructive action.
 * Focus starts on "Cancel", so pressing Enter by mistake never deletes.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      locked={isPending}
      initialFocusRef={cancelRef}
      role="alertdialog"
      labelledBy={titleId}
      describedBy={descriptionId}
    >
      <h2 id={titleId} className="font-display text-2xl leading-snug font-medium">
        {title}
      </h2>
      <p id={descriptionId} className="text-muted">
        {description}
      </p>

      {error && (
        <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full px-6 font-semibold text-muted transition-colors hover:bg-line/60 hover:text-ink disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-danger px-6 font-semibold text-white transition-colors hover:bg-danger-strong disabled:opacity-60"
        >
          {isPending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
