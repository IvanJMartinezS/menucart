import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router'
import { ErrorState } from '../../components/ui/ErrorState.tsx'
import { accountQueryOptions } from './queries.ts'
import { safeRedirect } from './redirect.ts'

function FullPageLoading() {
  const { t } = useTranslation()

  return (
    <p role="status" className="p-8 text-center text-muted">
      {t('common.loading')}
    </p>
  )
}

/**
 * Pages that need a session. Without one, it goes to the sign-in page and remembers the page
 * the user wanted in `?redirect=`, to come back after signing in.
 */
export function RequireAccount() {
  const account = useQuery(accountQueryOptions)
  const location = useLocation()

  if (account.isPending) {
    return <FullPageLoading />
  }

  if (account.isError) {
    return (
      <div className="mx-auto max-w-md p-4">
        <ErrorState onRetry={() => void account.refetch()} isRetrying={account.isFetching} />
      </div>
    )
  }

  if (!account.data) {
    const redirect = new URLSearchParams({ redirect: location.pathname + location.search })
    return <Navigate to={`/login?${redirect.toString()}`} replace />
  }

  return <Outlet />
}

/** Sign-in and registration pages: someone already signed in goes straight to the app. */
export function RedirectIfSignedIn() {
  const account = useQuery(accountQueryOptions)
  const [searchParams] = useSearchParams()

  if (account.isPending) {
    return <FullPageLoading />
  }

  if (account.data) {
    return <Navigate to={safeRedirect(searchParams.get('redirect'))} replace />
  }

  // Without an account, or when the API cannot be reached, the form is shown.
  return <Outlet />
}
