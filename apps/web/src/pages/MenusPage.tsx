import { useQuery } from '@tanstack/react-query'
import { UtensilsCrossed } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { ErrorState } from '../components/ui/ErrorState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { MenuCard, MenuCardSkeleton } from '../features/menus/MenuCard.tsx'
import { menusQueryOptions } from '../features/menus/queries.ts'

/** Two columns on phones, as in the sketch; more as the screen grows. */
const gridClassName = 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4'

export function MenusPage() {
  const { t } = useTranslation()
  const {
    data: menus,
    isPending,
    isError,
    refetch,
    isFetching,
    errorUpdateCount,
    errorUpdatedAt,
  } = useQuery(menusQueryOptions)

  let content: ReactNode

  if (isPending) {
    content = (
      <div role="status">
        <span className="sr-only">{t('common.loading')}</span>
        <div aria-hidden="true" className={gridClassName}>
          {Array.from({ length: 4 }, (_, index) => (
            <MenuCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  } else if (isError) {
    content = (
      <ErrorState
        onRetry={() => void refetch()}
        isRetrying={isFetching}
        // More than one error means the user already tried again and it failed too.
        lastFailedRetryAt={errorUpdateCount > 1 ? errorUpdatedAt : undefined}
      />
    )
  } else if (menus.length === 0) {
    content = (
      <EmptyState
        icon={UtensilsCrossed}
        title={t('menus.empty.title')}
        description={t('menus.empty.description')}
      />
    )
  } else {
    content = (
      <ul className={gridClassName}>
        {menus.map((menu) => (
          <li key={menu.id}>
            <MenuCard menu={menu} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={t('menus.eyebrow')}
        title={t('menus.title')}
        description={t('menus.description')}
      />
      {content}
    </>
  )
}
