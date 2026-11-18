import { MAX_PLAN_DAYS } from '@menucart/shared'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { coverColorFor } from '../menus/cover.ts'
import type { PlannableMenu } from './queries.ts'

type PlanMenuCardProps = {
  menu: PlannableMenu
  /** How many times the menu is planned; 0 when it is not in the plan. */
  times: number
  onChange: (times: number) => void
}

const roundButtonClassName =
  'flex size-11 items-center justify-center rounded-full transition-colors disabled:opacity-40'

/**
 * A menu of the catalog inside the plan, as in the "delivery app" sketch:
 * "+" to add it, then "− N +" to plan it several times. Chosen menus are highlighted.
 */
export function PlanMenuCard({ menu, times, onChange }: PlanMenuCardProps) {
  const { t } = useTranslation()
  const isChosen = times > 0

  return (
    <article
      aria-label={menu.name}
      className={`flex h-full flex-col overflow-hidden rounded-3xl border bg-surface transition-colors ${
        isChosen ? 'border-accent ring-2 ring-accent' : 'border-line'
      }`}
    >
      <div
        aria-hidden="true"
        className="flex h-24 items-center justify-center sm:h-28"
        style={{ backgroundColor: coverColorFor(menu.id) }}
      >
        <span className="font-display text-4xl font-medium text-ink/80">
          {menu.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-display text-base leading-snug font-medium">
          {menu.name}
        </h3>
        <p className="text-xs text-muted">
          {menu.archivedAt
            ? t('plan.menus.archived')
            : t('menus.ingredientCount', { count: menu.ingredients.length })}
        </p>
      </div>

      <div className="flex justify-end p-3 pt-0">
        {isChosen ? (
          <div className="flex items-center gap-1 rounded-full bg-accent-soft p-0.5">
            <button
              type="button"
              onClick={() => onChange(times - 1)}
              aria-label={t('plan.menus.removeOne', { name: menu.name })}
              className={`${roundButtonClassName} bg-surface text-accent-strong hover:bg-cream`}
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <span className="min-w-8 text-center font-bold text-accent-strong">
              {t('plan.menus.times', { count: times })}
            </span>
            <button
              type="button"
              onClick={() => onChange(times + 1)}
              disabled={times >= MAX_PLAN_DAYS}
              aria-label={t('plan.menus.addOneMore', { name: menu.name })}
              className={`${roundButtonClassName} bg-accent text-white hover:bg-accent-strong`}
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onChange(1)}
            // An archived menu stays visible in plans that have it, but cannot be added again.
            disabled={menu.archivedAt !== null}
            aria-label={t('plan.menus.add', { name: menu.name })}
            className={`${roundButtonClassName} bg-accent text-white hover:bg-accent-strong`}
          >
            <Plus aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
    </article>
  )
}
