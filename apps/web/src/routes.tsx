import { Navigate, type RouteObject } from 'react-router'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { EditMenuPage } from './pages/EditMenuPage.tsx'
import { GroceriesPage } from './pages/GroceriesPage.tsx'
import { MenusPage } from './pages/MenusPage.tsx'
import { NewMenuPage } from './pages/NewMenuPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { PlanPage } from './pages/PlanPage.tsx'
import { ShoppingListPage } from './pages/ShoppingListPage.tsx'

/** Every page of the app. Shared by the browser router and the tests. */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/menus" replace /> },
      { path: 'menus', element: <MenusPage /> },
      { path: 'menus/new', element: <NewMenuPage /> },
      { path: 'menus/:id/edit', element: <EditMenuPage /> },
      { path: 'groceries', element: <GroceriesPage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'shopping-list', element: <ShoppingListPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
