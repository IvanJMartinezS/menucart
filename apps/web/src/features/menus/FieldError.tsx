import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

/** Message under a form field that explains what is wrong with it. */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm font-medium text-accent-strong">
      <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </p>
  )
}
