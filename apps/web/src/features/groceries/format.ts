import type { GroceryUnit } from '@menucart/shared'
import type { TFunction } from 'i18next'

/**
 * "2 paquetes", "1,5 kg", "1 unidad": the number in the format of the language
 * (decimal comma in Spanish) and the unit in singular or plural.
 */
export function formatQuantity(
  t: TFunction,
  language: string,
  quantity: number,
  unit: GroceryUnit,
) {
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(quantity)
  return `${number} ${t(`groceries.units.${unit}`, { count: quantity })}`
}
