import { ShoppingBasket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'

export function GroceriesPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        eyebrow={t('groceries.eyebrow')}
        title={t('groceries.title')}
        description={t('groceries.description')}
      />
      <EmptyState
        icon={ShoppingBasket}
        title={t('groceries.empty.title')}
        description={t('groceries.empty.description')}
      />
    </>
  )
}
