import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  /** Optional action, for example a link to create the first item. */
  children?: ReactNode
}

/** Shown when a section has no content yet. */
export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <Icon aria-hidden="true" className="size-7" strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 font-display text-2xl font-medium">{title}</h2>
      <p className="mt-2 max-w-sm text-muted">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
