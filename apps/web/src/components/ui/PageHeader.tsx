import type { ReactNode } from 'react'

type PageHeaderProps = {
  /** Small label above the title, for example the section name. */
  eyebrow: string
  title: string
  description?: string
  /** Main action of the page, for example a link to create something. */
  action?: ReactNode
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-medium tracking-tight md:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-3 text-base text-muted">{description}</p>}
      </div>
      {action}
    </header>
  )
}
