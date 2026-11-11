import { CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'

export function PlanPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        eyebrow={t('plan.eyebrow')}
        title={t('plan.title')}
        description={t('plan.description')}
      />
      <EmptyState
        icon={CalendarDays}
        title={t('plan.empty.title')}
        description={t('plan.empty.description')}
      />
    </>
  )
}
