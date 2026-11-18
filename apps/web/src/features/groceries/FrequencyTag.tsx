import type { GroceryFrequency } from '@menucart/shared'
import { useTranslation } from 'react-i18next'

/** Each frequency has its own color, so they can be told apart at a glance (all 5:1 or more). */
const frequencyClassName: Record<GroceryFrequency, string> = {
  biweekly: 'bg-accent-soft text-accent-strong',
  monthly: 'bg-olive/10 text-olive',
  occasional: 'bg-line/70 text-muted',
}

/** "Quincenal", "Mensual" or "Eventual", as a small colored tag. */
export function FrequencyTag({ frequency }: { frequency: GroceryFrequency }) {
  const { t } = useTranslation()

  return (
    <span
      className={`w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${frequencyClassName[frequency]}`}
    >
      {t(`groceries.frequencies.${frequency}`)}
    </span>
  )
}
