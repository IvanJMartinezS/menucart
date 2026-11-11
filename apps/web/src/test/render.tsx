import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '../components/AppProviders.tsx'
import { routes } from '../routes.tsx'

/** Renders the whole app at a given URL, without a real browser, with an empty data cache. */
export function renderAt(path: string) {
  // No retries in tests: an error must show up at once.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}
