import type { GroceryUnit, IngredientCategory } from '@menucart/shared'
import { CalendarDays, Check, ClipboardList, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatQuantity } from '../../features/groceries/format.ts'

type SampleItem = {
  key: 'tomatoes' | 'onions' | 'steak' | 'flour'
  section: IngredientCategory | 'pantry'
  quantity: number
  unit: GroceryUnit
  checked: boolean
}

/** A small shopping list, half done: what the app gives every two weeks. */
const sampleItems: SampleItem[] = [
  { key: 'tomatoes', section: 'vegetables', quantity: 1, unit: 'kg', checked: true },
  { key: 'onions', section: 'vegetables', quantity: 3, unit: 'unit', checked: true },
  { key: 'steak', section: 'meat', quantity: 2, unit: 'kg', checked: false },
  { key: 'flour', section: 'pantry', quantity: 2, unit: 'package', checked: false },
]

const steps = [
  { key: 'menus', icon: UtensilsCrossed },
  { key: 'plan', icon: CalendarDays },
  { key: 'list', icon: ClipboardList },
] as const

/**
 * Panel next to the sign-in and registration forms on large screens: the brand, what the app
 * does and an example of its shopping list. Drawn with CSS, without images.
 */
export function AuthShowcase() {
  const { t, i18n } = useTranslation()
  const checkedCount = sampleItems.filter((item) => item.checked).length

  return (
    <div className="flex h-full flex-col gap-10 bg-ink px-12 pb-12 text-cream">
      {/* As tall as the header on the right (h-16), so the logo lines up with the language. */}
      <p className="flex h-16 shrink-0 items-center font-display text-3xl font-semibold tracking-tight">
        Menu<span className="text-accent-soft">Cart</span>
      </p>

      {/*
        The rest goes in a centered column, so on wide screens it does not stick to the left
        edge. The example sits in the middle of the free space and the steps at the bottom.
      */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-10">
        <div className="my-auto flex flex-col gap-10">
          <p className="max-w-md font-display text-5xl leading-tight font-medium">
            {t('auth.tagline')}
          </p>

          {/* An illustration: the real list is on the shopping list page. */}
          <div
            aria-hidden="true"
            className="w-full max-w-sm -rotate-2 rounded-3xl bg-cream p-5 text-ink shadow-2xl shadow-black/40"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="font-display text-xl font-medium">{t('auth.showcase.list')}</p>
              <p className="text-xs font-semibold text-muted">
                {t('shoppingList.progress', { checked: checkedCount, total: sampleItems.length })}
              </p>
            </div>
            <ul className="divide-y divide-line">
              {sampleItems.map((item) => (
                <li key={item.key} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                      item.checked ? 'border-accent bg-accent text-white' : 'border-line bg-surface'
                    }`}
                  >
                    {item.checked && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className={`flex-1 ${item.checked ? 'text-muted line-through' : ''}`}>
                    <span className="block font-semibold">{t(`auth.showcase.${item.key}`)}</span>
                    <span className="block text-xs text-muted">
                      {t(`shoppingList.sections.${item.section}`)}
                    </span>
                  </span>
                  <span
                    className={`text-sm font-bold ${item.checked ? 'text-muted line-through' : 'text-accent-strong'}`}
                  >
                    {formatQuantity(t, i18n.language, item.quantity, item.unit)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* One line from 1280 px up; on narrower panels they wrap instead of overflowing. */}
        <ol className="flex flex-wrap gap-x-4 gap-y-3 text-sm font-semibold xl:flex-nowrap">
          {steps.map(({ key, icon: Icon }, index) => (
            <li key={key} className="flex items-center gap-2 whitespace-nowrap">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cream/10">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span>
                {index + 1}. {t(`auth.showcase.steps.${key}`)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
