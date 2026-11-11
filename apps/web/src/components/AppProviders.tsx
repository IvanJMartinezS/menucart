import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

type AppProvidersProps = {
  queryClient: QueryClient
  children: ReactNode
}

/** Everything the screens need around them. Shared by the app and the tests. */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
