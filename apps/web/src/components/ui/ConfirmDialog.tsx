import { useEffect, useId, useRef } from 'react'

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
 *
 * Built on the native `<dialog>`: it blocks the rest of the page, keeps the focus inside and
 * closes with Escape. Focus starts on "Cancel", so pressing Enter by mistake never deletes.
 * On phones it opens from the bottom of the screen, within reach of the thumb.
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && dialog && !dialog.open) {
      dialog.showModal()
      // Start on the safe option, explicitly: not every browser picks the same element.
      cancelRef.current?.focus()
    }
  }, [open])

  if (!open) {
    return null
  }

  const cancel = () => {
    if (!isPending) {
      onCancel()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        // Escape: closing is handled by React state, not by the browser.
        event.preventDefault()
        cancel()
      }}
      onKeyDown={(event) => {
        // Escape is handled here too, so it works the same in every browser.
        if (event.key === 'Escape') {
          event.preventDefault()
          cancel()
        }
      }}
      onClick={(event) => {
        // A click on the dark backdrop (outside the content) closes the dialog.
        if (event.target === event.currentTarget) {
          cancel()
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/50 max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none"
    >
      <div className="flex flex-col gap-4 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
            onClick={cancel}
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
      </div>
    </dialog>
  )
}
