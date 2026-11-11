import { useQuery } from '@tanstack/react-query'
import { UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { ErrorState } from '../components/ui/ErrorState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { menusQueryOptions } from '../features/menus/queries.ts'

export function MenusPage() {
  const { t } = useTranslation()
  const { data: menus, isPending, isError, refetch, isFetching } = useQuery(menusQueryOptions)

  return (
    <>
      <PageHeader
        eyebrow={t('menus.eyebrow')}
        title={t('menus.title')}
        description={t('menus.description')}
      />

      {isPending ? (
        <p role="status" className="text-muted">
          {t('common.loading')}
        </p>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : menus.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={t('menus.empty.title')}
          description={t('menus.empty.description')}
        />
      ) : (
        // Simple list for now: the menu cards come in the next step.
        <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
          {menus.map((menu) => (
            <li key={menu.id} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <span className="font-display text-lg font-medium">{menu.name}</span>
              <span className="text-sm text-muted">
                {t('menus.ingredientCount', { count: menu.ingredients.length })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
