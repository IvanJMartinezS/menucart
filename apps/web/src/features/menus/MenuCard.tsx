import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { coverColorFor } from './cover.ts'
import type { Menu } from './queries.ts'

/** How many ingredient names are shown on the card before "and N more". */
const PREVIEW_SIZE = 3

type MenuCardProps = {
  menu: Menu
}

/**
 * A menu in the catalog: a cover (a colored tile with the initial until menus have photos),
 * the name, the number of ingredients and the first ones.
 * The whole card opens the menu: its title is a link stretched over the card.
 */
export function MenuCard({ menu }: MenuCardProps) {
  const { t } = useTranslation()
  const titleId = `menu-${menu.id}`
  const preview = menu.ingredients.slice(0, PREVIEW_SIZE).map(({ name }) => name)
  const hidden = menu.ingredients.length - preview.length

  return (
    <article
      aria-labelledby={titleId}
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-colors focus-within:ring-2 focus-within:ring-accent hover:border-ink/40"
    >
      <div
        aria-hidden="true"
        className="flex h-28 items-center justify-center sm:h-36"
        style={{ backgroundColor: coverColorFor(menu.id) }}
      >
        <span className="font-display text-5xl font-medium text-ink/80">
          {menu.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 id={titleId} className="line-clamp-2 font-display text-lg leading-snug font-medium">
          <Link
            to={`/menus/${menu.id}/edit`}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {menu.name}
          </Link>
        </h2>
        <p className="text-sm font-semibold text-accent-strong">
          {t('menus.ingredientCount', { count: menu.ingredients.length })}
        </p>
        <p className="line-clamp-2 text-sm text-muted">
          {preview.join(', ')}
          {hidden > 0 && ` ${t('menus.moreIngredients', { count: hidden })}`}
        </p>
      </div>
    </article>
  )
}

/** Gray placeholder with the shape of a card, shown while menus load. */
export function MenuCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="h-28 bg-line/60 sm:h-36" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-3/4 rounded-full bg-line/80" />
        <div className="h-4 w-1/3 rounded-full bg-line/60" />
        <div className="h-4 w-2/3 rounded-full bg-line/60" />
      </div>
    </div>
  )
}
