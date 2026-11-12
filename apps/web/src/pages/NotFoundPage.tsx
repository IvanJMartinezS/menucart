import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { EmptyState } from '../components/ui/EmptyState.tsx'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <EmptyState icon={SearchX} title={t('notFound.title')} description={t('notFound.description')}>
      <Link
        to="/menus"
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        {t('notFound.back')}
      </Link>
    </EmptyState>
  )
}
