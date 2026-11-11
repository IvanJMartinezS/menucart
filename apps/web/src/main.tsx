import '@fontsource-variable/fraunces'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import './i18n/index.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppProviders } from './components/AppProviders.tsx'
import { createQueryClient } from './lib/query-client.ts'
import { routes } from './routes.tsx'

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
