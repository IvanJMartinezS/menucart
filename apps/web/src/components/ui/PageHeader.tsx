type PageHeaderProps = {
  /** Small label above the title, for example the section name. */
  eyebrow: string
  title: string
  description?: string
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 max-w-2xl">
      <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl leading-tight font-medium tracking-tight md:text-5xl">
        {title}
      </h1>
      {description && <p className="mt-3 text-base text-muted">{description}</p>}
    </header>
  )
}
