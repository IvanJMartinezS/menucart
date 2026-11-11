import { UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'

export function MenusPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        eyebrow={t('menus.eyebrow')}
        title={t('menus.title')}
        description={t('menus.description')}
      />
      <EmptyState
        icon={UtensilsCrossed}
        title={t('menus.empty.title')}
        description={t('menus.empty.description')}
      />
    </>
  )
}
