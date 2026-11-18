import { planGroceryInputSchema } from '@menucart/shared'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FrequencyTag } from '../groceries/FrequencyTag.tsx'
import type { Grocery } from '../groceries/queries.ts'

type PlanGroceryRowProps = {
  grocery: Grocery
  /** Quantity to buy in this plan; `null` when the grocery is not checked. */
  quantity: number | null
  onChange: (quantity: number | null) => void
}

/**
 * A grocery of the catalog inside the plan: a checkbox to buy it, and the quantity.
 * Checking it starts with its usual quantity. The quantity is saved when leaving the field
 * (or pressing Enter), not on every key; an invalid one goes back to the saved value.
 */
export function PlanGroceryRow({ grocery, quantity, onChange }: PlanGroceryRowProps) {
  const { t } = useTranslation()
  const checkboxId = useId()
  const isChecked = quantity !== null
  const shownQuantity = quantity ?? grocery.defaultQuantity
  // What is being typed, only while editing; otherwise the field shows the saved quantity.
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) {
      return
    }
    const parsed = planGroceryInputSchema.safeParse({ quantity: Number(draft) })
    if (parsed.success && draft.trim() !== '' && parsed.data.quantity !== quantity) {
      onChange(parsed.data.quantity)
    }
    setDraft(null)
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2 pr-3 pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={isChecked}
          onChange={(event) => onChange(event.target.checked ? grocery.defaultQuantity : null)}
          aria-label={t('plan.groceries.check', { name: grocery.name })}
          className="size-5 shrink-0 accent-accent"
        />
        <label htmlFor={checkboxId} className="flex min-h-11 min-w-0 items-center gap-2">
          <span className={`truncate font-semibold ${isChecked ? '' : 'text-muted'}`}>
            {grocery.name}
          </span>
          <FrequencyTag frequency={grocery.frequency} />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={draft ?? String(shownQuantity)}
          disabled={!isChecked}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
          aria-label={t('plan.groceries.quantityOf', { name: grocery.name })}
          className="min-h-11 w-20 rounded-xl border border-line bg-surface px-2 text-right text-base focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none disabled:bg-cream disabled:text-muted"
        />
        <span className="w-16 text-sm text-muted">
          {t(`groceries.units.${grocery.unit}`, { count: shownQuantity })}
        </span>
      </div>
    </li>
  )
}
