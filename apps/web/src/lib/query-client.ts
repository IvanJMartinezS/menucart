import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { accountQueryKey } from '../features/auth/queries.ts'
import { ApiError } from './api.ts'

const isSessionEnded = (error: unknown) => error instanceof ApiError && error.status === 401

/**
 * Cache of the data loaded from the API, shared by every screen.
 * `retries` is how many times a failed request is tried again (none in tests).
 */
export function createQueryClient({ retries = 1 } = {}) {
  /**
   * Any 401 means that the session is over (it expired, or was closed on this device):
   * forgetting the account sends the user to the sign-in page.
   */
  const onError = (error: unknown) => {
    if (isSessionEnded(error)) {
      queryClient.setQueryData(accountQueryKey, null)
    }
  }

  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds: navigating between screens does not refetch it.
        staleTime: 30_000,
        // Errors of the request itself (4xx) do not change by trying again, so they are not retried.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) && failureCount < retries,
      },
    },
  })

  return queryClient
}
