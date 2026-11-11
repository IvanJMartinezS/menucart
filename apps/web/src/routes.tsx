import type { RouteObject } from 'react-router'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { GroceriesPage } from './pages/GroceriesPage.tsx'
import { MenusPage } from './pages/MenusPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { PlanPage } from './pages/PlanPage.tsx'
import { ShoppingListPage } from './pages/ShoppingListPage.tsx'

/** Every page of the app. Shared by the browser router and the tests. */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <MenusPage /> },
      { path: 'groceries', element: <GroceriesPage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'shopping-list', element: <ShoppingListPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
