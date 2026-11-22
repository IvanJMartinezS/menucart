import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '../components/AppProviders.tsx'
import { type Account, accountQueryKey } from '../features/auth/queries.ts'
import { createQueryClient } from '../lib/query-client.ts'
import { routes } from '../routes.tsx'
import { testAccount } from './accounts.ts'

type RenderOptions = {
  /**
   * Who is signed in: `testAccount` by default, `null` for nobody, or `'from-api'` to let the
   * app ask the (mocked) API, as it does when it opens.
   */
  account?: Account | null | 'from-api'
}

/** Renders the whole app at a given URL, without a real browser, with an empty data cache. */
export function renderAt(path: string, { account = testAccount }: RenderOptions = {}) {
  // No retries in tests: an error must show up at once.
  const queryClient = createQueryClient({ retries: 0 })
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  if (account !== 'from-api') {
    queryClient.setQueryData(accountQueryKey, account)
  }

  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}
