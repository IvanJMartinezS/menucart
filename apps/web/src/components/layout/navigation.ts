import { CalendarDays, ClipboardList, ShoppingBasket, UtensilsCrossed } from 'lucide-react'

/** Main sections of the app, in the order they are shown in the navigation. */
export const navigationItems = [
  { to: '/', labelKey: 'nav.menus', icon: UtensilsCrossed },
  { to: '/groceries', labelKey: 'nav.groceries', icon: ShoppingBasket },
  { to: '/plan', labelKey: 'nav.plan', icon: CalendarDays },
  { to: '/shopping-list', labelKey: 'nav.shoppingList', icon: ClipboardList },
] as const
