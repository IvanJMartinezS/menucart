import type { LucideIcon } from 'lucide-react'
import { Link, type LinkProps } from 'react-router'

type ButtonLinkProps = LinkProps & {
  icon?: LucideIcon
}

/** A link that looks like the main button of the app. */
export function ButtonLink({ icon: Icon, children, className = '', ...props }: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong ${className}`}
    >
      {Icon && <Icon aria-hidden="true" className="size-5" />}
      {children}
    </Link>
  )
}
