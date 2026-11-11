import { CalendarDays, ClipboardList, ShoppingBasket, UtensilsCrossed } from 'lucide-react'

/** Main sections of the app, in the order they are shown in the navigation. */
export const navigationItems = [
  { to: '/', label: 'Menús', icon: UtensilsCrossed },
  { to: '/groceries', label: 'Víveres', icon: ShoppingBasket },
  { to: '/plan', label: 'Quincena', icon: CalendarDays },
  { to: '/shopping-list', label: 'Lista', icon: ClipboardList },
] as const
