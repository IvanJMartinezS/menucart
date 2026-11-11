import { CloudOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from './EmptyState.tsx'

type ErrorStateProps = {
  onRetry: () => void
  /** True while the retry is in progress. */
  isRetrying?: boolean
}

/** Shown when data could not be loaded from the API. */
export function ErrorState({ onRetry, isRetrying = false }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div role="alert">
      <EmptyState
        icon={CloudOff}
        title={t('errors.connection.title')}
        description={t('errors.connection.description')}
      >
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {isRetrying ? t('common.loading') : t('common.retry')}
        </button>
      </EmptyState>
    </div>
  )
}
