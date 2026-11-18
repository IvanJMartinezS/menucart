import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ClipboardList, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonLink } from '../components/ui/ButtonLink.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { ErrorState } from '../components/ui/ErrorState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { currentPlanQueryOptions, type Plan } from '../features/plans/queries.ts'
import { shoppingListQueryOptions } from '../features/shopping-list/queries.ts'
import { ShoppingListItem } from '../features/shopping-list/ShoppingListItem.tsx'
import { itemKey, useCheckedItems } from '../features/shopping-list/use-checked-items.ts'
import { formatShortDate, todayIso } from '../lib/dates.ts'

const loading = (text: string) => (
  <p role="status" className="text-muted">
    {text}
  </p>
)

/** The list of the plan in progress, with the products checked on this device. */
function ShoppingListView({ plan }: { plan: Plan }) {
  const { t, i18n } = useTranslation()
  const list = useQuery(shoppingListQueryOptions(plan.id))
  const checks = useCheckedItems(plan.id)

  const header = (
    <PageHeader
      eyebrow={t('shoppingList.eyebrow')}
      title={t('shoppingList.title')}
      description={t('plan.period', {
        start: formatShortDate(plan.startDate, i18n.language),
        end: formatShortDate(plan.endDate, i18n.language),
      })}
    />
  )

  if (list.isPending) {
    return (
      <>
        {header}
        {loading(t('common.loading'))}
      </>
    )
  }

  if (list.isError) {
    return (
      <>
        {header}
        <ErrorState onRetry={() => void list.refetch()} isRetrying={list.isFetching} />
      </>
    )
  }

  const { sections } = list.data
  const keys = sections.flatMap(({ category, items }) =>
    items.map(({ name, unit }) => itemKey(category, name, unit)),
  )

  if (keys.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={ClipboardList}
          title={t('shoppingList.empty.title')}
          description={t('shoppingList.empty.description')}
        >
          <ButtonLink to="/plan" icon={CalendarDays}>
            {t('shoppingList.goToPlan')}
          </ButtonLink>
        </EmptyState>
      </>
    )
  }

  const checkedCount = checks.countChecked(keys)

  return (
    <>
      {header}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-semibold">
          {t('shoppingList.progress', { checked: checkedCount, total: keys.length })}
        </p>
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={checks.clear}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:bg-line/60 hover:text-ink"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {t('shoppingList.clear')}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {sections.map(({ category, items }) => (
          <section key={category} aria-labelledby={`section-${category}`}>
            <h2 id={`section-${category}`} className="mb-2 font-display text-2xl font-medium">
              {t(`shoppingList.sections.${category}`)}
            </h2>
            <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
              {items.map((item) => {
                const key = itemKey(category, item.name, item.unit)
                return (
                  <ShoppingListItem
                    key={key}
                    item={item}
                    checked={checks.isChecked(key)}
                    onToggle={() => checks.toggle(key)}
                  />
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">{t('shoppingList.deviceNote')}</p>
    </>
  )
}

export function ShoppingListPage() {
  const { t } = useTranslation()
  const [today] = useState(todayIso)
  const current = useQuery(currentPlanQueryOptions(today))

  const header = (
    <PageHeader
      eyebrow={t('shoppingList.eyebrow')}
      title={t('shoppingList.title')}
      description={t('shoppingList.description')}
    />
  )

  if (current.isPending) {
    return (
      <>
        {header}
        {loading(t('common.loading'))}
      </>
    )
  }

  if (current.isError) {
    return (
      <>
        {header}
        <ErrorState onRetry={() => void current.refetch()} isRetrying={current.isFetching} />
      </>
    )
  }

  if (!current.data) {
    return (
      <>
        {header}
        <EmptyState
          icon={CalendarDays}
          title={t('shoppingList.noPlan.title')}
          description={t('shoppingList.noPlan.description')}
        >
          <ButtonLink to="/plan" icon={CalendarDays}>
            {t('shoppingList.goToPlan')}
          </ButtonLink>
        </EmptyState>
      </>
    )
  }

  // A new key per plan, so the checks of one plan never leak into another.
  return <ShoppingListView key={current.data.id} plan={current.data} />
}
