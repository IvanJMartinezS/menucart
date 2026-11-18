import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { formatQuantity } from '../groceries/format.ts'
import type { ShoppingItem } from './queries.ts'

type ShoppingListItemProps = {
  item: ShoppingItem
  checked: boolean
  onToggle: () => void
}

/**
 * One product of the list. The whole row toggles it, so it is easy to tap with one hand
 * in the market. Checked products are struck through and dimmed.
 */
export function ShoppingListItem({ item, checked, onToggle }: ShoppingListItemProps) {
  const { t, i18n } = useTranslation()
  const id = useId()
  const quantity = item.unit
    ? formatQuantity(t, i18n.language, item.quantity, item.unit)
    : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(item.quantity)

  return (
    <li>
      <label
        htmlFor={id}
        className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-cream/60"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={t('shoppingList.check', { name: item.name })}
          className="size-5 shrink-0 accent-accent"
        />
        <span className={`flex min-w-0 flex-1 flex-col ${checked ? 'opacity-50' : ''}`}>
          <span className={`font-semibold ${checked ? 'line-through' : ''}`}>{item.name}</span>
          {item.usedIn.length > 0 && (
            <span className="truncate text-xs text-muted">
              {t('shoppingList.usedIn', { menus: item.usedIn.join(', ') })}
            </span>
          )}
        </span>
        <span
          className={`shrink-0 text-right font-bold ${checked ? 'text-muted line-through' : 'text-accent-strong'}`}
        >
          {quantity}
        </span>
      </label>
    </li>
  )
}
