import { groceryCategories } from '@menucart/shared'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '../components/ui/ErrorState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { groceriesQueryOptions } from '../features/groceries/queries.ts'
import { menusQueryOptions } from '../features/menus/queries.ts'
import { CartBar } from '../features/plans/CartBar.tsx'
import { CreatePlanForm } from '../features/plans/CreatePlanForm.tsx'
import { PlanGroceryRow } from '../features/plans/PlanGroceryRow.tsx'
import { PlanMenuCard } from '../features/plans/PlanMenuCard.tsx'
import {
  currentPlanQueryOptions,
  type Plan,
  type PlannableMenu,
  planSuggestionQueryOptions,
  useSetPlanGrocery,
  useSetPlanMenu,
} from '../features/plans/queries.ts'
import { formatShortDate, todayIso } from '../lib/dates.ts'

const loading = (text: string) => (
  <p role="status" className="text-muted">
    {text}
  </p>
)

/** No plan yet: propose dates and start one. */
function StartPlan({ today }: { today: string }) {
  const { t } = useTranslation()
  const suggestion = useQuery(planSuggestionQueryOptions(today))

  if (suggestion.isPending) {
    return loading(t('common.loading'))
  }
  if (suggestion.isError) {
    return (
      <ErrorState onRetry={() => void suggestion.refetch()} isRetrying={suggestion.isFetching} />
    )
  }
  return <CreatePlanForm suggestion={suggestion.data} />
}

/** The plan in progress: choose its menus and groceries. */
function PlanEditor({ plan, today }: { plan: Plan; today: string }) {
  const { t, i18n } = useTranslation()
  const menus = useQuery(menusQueryOptions)
  const groceries = useQuery(groceriesQueryOptions)
  const setMenu = useSetPlanMenu(today, plan.id)
  const setGrocery = useSetPlanGrocery(today, plan.id)
  const [onlyChosen, setOnlyChosen] = useState(false)

  const timesByMenu = new Map(plan.menus.map(({ menuId, times }) => [menuId, times]))
  const quantityByGrocery = new Map(
    plan.groceries.map(({ groceryId, quantity }) => [groceryId, quantity]),
  )
  const chosenCount = plan.menus.reduce((total, { times }) => total + times, 0)

  // The catalog, plus the archived menus this plan still has (they are no longer in the catalog).
  const catalog = menus.data ?? []
  const archivedInPlan = plan.menus
    .map(({ menu }) => menu)
    .filter((menu) => !catalog.some(({ id }) => id === menu.id))
  const allMenus: PlannableMenu[] = [...catalog, ...archivedInPlan]
  const shownMenus = onlyChosen ? allMenus.filter(({ id }) => timesByMenu.has(id)) : allMenus

  const filterButton = (chosen: boolean, label: string) => (
    <button
      type="button"
      aria-pressed={onlyChosen === chosen}
      onClick={() => setOnlyChosen(chosen)}
      className="min-h-10 rounded-full px-4 text-sm font-semibold text-muted transition-colors aria-pressed:bg-ink aria-pressed:text-cream"
    >
      {label}
    </button>
  )

  return (
    <>
      <PageHeader
        eyebrow={t('plan.eyebrow')}
        title={t('plan.period', {
          start: formatShortDate(plan.startDate, i18n.language),
          end: formatShortDate(plan.endDate, i18n.language),
        })}
        description={t('plan.length', {
          count:
            Math.round(
              (Date.parse(`${plan.endDate}T00:00:00Z`) -
                Date.parse(`${plan.startDate}T00:00:00Z`)) /
                86_400_000,
            ) + 1,
        })}
      />

      {(setMenu.isError || setGrocery.isError) && (
        <p
          role="alert"
          className="mb-6 rounded-2xl bg-accent-soft px-4 py-3 font-medium text-danger"
        >
          {t('plan.saveError')}
        </p>
      )}

      <section aria-labelledby="plan-menus" className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="plan-menus" className="font-display text-2xl font-medium">
            {t('plan.menus.title')}
          </h2>
          <div
            role="group"
            aria-label={t('plan.menus.filter')}
            className="flex rounded-full border border-line bg-surface p-0.5"
          >
            {filterButton(false, t('plan.menus.all'))}
            {filterButton(true, t('plan.menus.chosen', { count: plan.menus.length }))}
          </div>
        </div>

        {menus.isPending ? (
          loading(t('common.loading'))
        ) : menus.isError ? (
          <ErrorState onRetry={() => void menus.refetch()} isRetrying={menus.isFetching} />
        ) : shownMenus.length === 0 ? (
          <p className="text-muted">
            {onlyChosen ? t('plan.menus.noneChosen') : t('plan.menus.noMenus')}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shownMenus.map((menu) => (
              <li key={menu.id}>
                <PlanMenuCard
                  menu={menu}
                  times={timesByMenu.get(menu.id) ?? 0}
                  onChange={(times) => setMenu.mutate({ menu, times })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="plan-groceries">
        <h2 id="plan-groceries" className="mb-4 font-display text-2xl font-medium">
          {t('plan.groceries.title')}
        </h2>

        {groceries.isPending ? (
          loading(t('common.loading'))
        ) : groceries.isError ? (
          <ErrorState onRetry={() => void groceries.refetch()} isRetrying={groceries.isFetching} />
        ) : groceries.data.length === 0 ? (
          <p className="text-muted">{t('plan.groceries.noGroceries')}</p>
        ) : (
          <div className="flex flex-col gap-6">
            {groceryCategories.map((category) => {
              const inCategory = groceries.data.filter((grocery) => grocery.category === category)
              if (inCategory.length === 0) {
                return null
              }
              return (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-bold tracking-wide text-muted uppercase">
                    {t(`groceries.categories.${category}`)}
                  </h3>
                  <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
                    {inCategory.map((grocery) => (
                      <PlanGroceryRow
                        key={grocery.id}
                        grocery={grocery}
                        quantity={quantityByGrocery.get(grocery.id) ?? null}
                        onChange={(quantity) => setGrocery.mutate({ grocery, quantity })}
                      />
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Room so the floating cart never covers the last grocery. */}
      <div aria-hidden="true" className="h-24" />
      <CartBar menuCount={chosenCount} groceryCount={plan.groceries.length} />
    </>
  )
}

export function PlanPage() {
  const { t } = useTranslation()
  // Read once: the plan screen works with the day it was opened.
  const [today] = useState(todayIso)
  const current = useQuery(currentPlanQueryOptions(today))

  if (current.isPending) {
    return loading(t('common.loading'))
  }

  if (current.isError) {
    return (
      <ErrorState
        onRetry={() => void current.refetch()}
        isRetrying={current.isFetching}
        lastFailedRetryAt={current.errorUpdateCount > 1 ? current.errorUpdatedAt : undefined}
      />
    )
  }

  if (!current.data) {
    return (
      <>
        <PageHeader
          eyebrow={t('plan.eyebrow')}
          title={t('plan.title')}
          description={t('plan.description')}
        />
        <StartPlan today={today} />
      </>
    )
  }

  return <PlanEditor plan={current.data} today={today} />
}
