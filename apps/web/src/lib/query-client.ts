import { QueryClient } from '@tanstack/react-query'

/** Cache of the data loaded from the API, shared by every screen. */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds: navigating between screens does not refetch it.
        staleTime: 30_000,
        retry: 1,
      },
    },
  })
