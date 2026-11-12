import { CloudOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from './EmptyState.tsx'

type ErrorStateProps = {
  onRetry: () => void
  /** True while the retry is in progress. */
  isRetrying?: boolean
  /**
   * When the last retry failed (timestamp in milliseconds). Only set after a retry: the first
   * error does not need it. Showing the time makes every attempt visible, even when it fails again.
   */
  lastFailedRetryAt?: number
}

/** Shown when data could not be loaded from the API. */
export function ErrorState({ onRetry, isRetrying = false, lastFailedRetryAt }: ErrorStateProps) {
  const { t, i18n } = useTranslation()

  return (
    <div role="alert">
      <EmptyState
        icon={CloudOff}
        title={t('errors.connection.title')}
        description={t('errors.connection.description')}
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {isRetrying ? t('common.loading') : t('common.retry')}
          </button>

          {lastFailedRetryAt !== undefined && !isRetrying && (
            <p className="text-sm text-muted">
              {t('errors.connection.stillFailing', {
                time: new Intl.DateTimeFormat(i18n.language, { timeStyle: 'medium' }).format(
                  lastFailedRetryAt,
                ),
              })}
            </p>
          )}
        </div>
      </EmptyState>
    </div>
  )
}
