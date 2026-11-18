import { ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

type CartBarProps = {
  /** Planned menus, counting repetitions. */
  menuCount: number
  groceryCount: number
}

/**
 * Floating summary of the plan, like the cart of a delivery app: always in view while choosing,
 * with the way to the shopping list. On phones it sits above the bottom navigation.
 */
export function CartBar({ menuCount, groceryCount }: CartBarProps) {
  const { t } = useTranslation()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 px-4 md:bottom-6">
      <div
        role="status"
        className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl bg-ink py-2 pr-2 pl-4 text-cream shadow-xl"
      >
        <span className="flex items-center gap-3 text-sm font-semibold">
          <ShoppingCart aria-hidden="true" className="size-5 shrink-0" />
          {t('plan.cart.menus', { count: menuCount })} ·{' '}
          {t('plan.cart.groceries', { count: groceryCount })}
        </span>
        <Link
          to="/shopping-list"
          className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
        >
          {t('plan.cart.viewList')}
        </Link>
      </div>
    </div>
  )
}
