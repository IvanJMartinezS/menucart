import { ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'

export function ShoppingListPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        eyebrow={t('shoppingList.eyebrow')}
        title={t('shoppingList.title')}
        description={t('shoppingList.description')}
      />
      <EmptyState
        icon={ClipboardList}
        title={t('shoppingList.empty.title')}
        description={t('shoppingList.empty.description')}
      />
    </>
  )
}
