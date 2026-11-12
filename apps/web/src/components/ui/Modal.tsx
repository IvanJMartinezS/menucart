import { type ReactNode, type RefObject, useEffect, useRef } from 'react'

type ModalProps = {
  open: boolean
  /** Called on Escape or on a click on the backdrop. */
  onClose: () => void
  /** While true, Escape and the backdrop do not close it (for example, while saving). */
  locked?: boolean
  /** Element that gets the focus when the modal opens. */
  initialFocusRef: RefObject<HTMLElement | null>
  role?: 'dialog' | 'alertdialog'
  labelledBy: string
  describedBy?: string
  children: ReactNode
}

/**
 * Base for every modal of the app, built on the native `<dialog>`: it blocks the rest of the
 * page and keeps the focus inside. Escape, a click on the backdrop and the initial focus are
 * handled explicitly, so they behave the same in every browser.
 * Centered on large screens, it opens from the bottom on phones, within reach of the thumb.
 */
export function Modal({
  open,
  onClose,
  locked = false,
  initialFocusRef,
  role = 'dialog',
  labelledBy,
  describedBy,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && dialog && !dialog.open) {
      dialog.showModal()
      initialFocusRef.current?.focus()
    }
  }, [open, initialFocusRef])

  if (!open) {
    return null
  }

  const close = () => {
    if (!locked) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        // Closing is handled by React state, not by the browser.
        event.preventDefault()
        close()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          close()
        }
      }}
      onClick={(event) => {
        // A click on the dark backdrop (outside the content) closes the modal.
        if (event.target === event.currentTarget) {
          close()
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/50 max-md:mb-0 max-md:max-h-[90dvh] max-md:w-full max-md:max-w-none max-md:rounded-b-none"
    >
      <div className="flex flex-col gap-4 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </dialog>
  )
}
