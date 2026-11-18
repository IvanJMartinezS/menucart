import type { GroceryCategory, GroceryUnit } from './grocery.ts'
import type { IngredientCategory } from './menu.ts'

/** A section of the shopping list: the ingredient categories of menus plus the grocery ones. */
export type ShoppingCategory = IngredientCategory | GroceryCategory

/** Order of the sections, following a walk through the market. */
export const shoppingCategories: readonly ShoppingCategory[] = [
  'vegetables',
  'meat',
  'deli',
  'pantry',
]

export type ShoppingItem = {
  /** The most used way of writing it ("cebolla" if it was written so more often than "Cebolla"). */
  name: string
  /** Total to buy, rounded to two decimals. */
  quantity: number
  /** Unit of groceries; `null` for menu ingredients, which have none. */
  unit: GroceryUnit | null
  /** Menus that need it, in the order they were first found. Empty for groceries. */
  usedIn: string[]
}

export type ShoppingSection = {
  category: ShoppingCategory
  items: ShoppingItem[]
}

/** What the list is built from: the menus of a plan (with their repetitions) and its groceries. */
export type ShoppingListInput = {
  menus: {
    times: number
    menu: {
      name: string
      ingredients: { name: string; quantity: number; category: IngredientCategory }[]
    }
  }[]
  groceries: { name: string; category: GroceryCategory; unit: GroceryUnit; quantity: number }[]
}

/**
 * The key used to decide that two names are the same ingredient: no capital letters, no accents,
 * no extra spaces. "Cebolla ", "cebolla" and "Cebollá" all give "cebolla".
 */
export function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** An item while it is being added up: every spelling seen, so the most used one can be chosen. */
type Accumulator = {
  category: ShoppingCategory
  unit: GroceryUnit | null
  quantity: number
  spellings: Map<string, number>
  usedIn: string[]
}

const roundQuantity = (quantity: number) => Math.round(quantity * 100) / 100

/** The spelling written most often; on a tie, the one seen first. */
const mostUsedSpelling = (spellings: Map<string, number>) =>
  [...spellings].reduce((best, current) => (current[1] > best[1] ? current : best))[0]

/**
 * Builds the shopping list of a plan:
 * - each menu ingredient is multiplied by how many times the menu is planned;
 * - the same ingredient from several menus is added up (see `normalizeName`);
 * - groceries are added up only when they share the unit (1 kg and 500 g stay apart);
 * - items are grouped by section, in market order, and sorted by name.
 * Sections with nothing to buy are left out.
 */
export function buildShoppingList({ menus, groceries }: ShoppingListInput): ShoppingSection[] {
  const items = new Map<string, Accumulator>()

  const add = (
    key: string,
    name: string,
    quantity: number,
    category: ShoppingCategory,
    unit: GroceryUnit | null,
    menuName?: string,
  ) => {
    const item = items.get(key) ?? {
      category,
      unit,
      quantity: 0,
      spellings: new Map<string, number>(),
      usedIn: [],
    }
    const spelling = name.trim()
    item.quantity += quantity
    item.spellings.set(spelling, (item.spellings.get(spelling) ?? 0) + 1)
    if (menuName && !item.usedIn.includes(menuName)) {
      item.usedIn.push(menuName)
    }
    items.set(key, item)
  }

  for (const { times, menu } of menus) {
    for (const ingredient of menu.ingredients) {
      add(
        `ingredient:${normalizeName(ingredient.name)}`,
        ingredient.name,
        ingredient.quantity * times,
        ingredient.category,
        null,
        menu.name,
      )
    }
  }

  for (const grocery of groceries) {
    add(
      `grocery:${normalizeName(grocery.name)}:${grocery.unit}`,
      grocery.name,
      grocery.quantity,
      grocery.category,
      grocery.unit,
    )
  }

  const byName = (a: ShoppingItem, b: ShoppingItem) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })

  return shoppingCategories
    .map((category) => ({
      category,
      items: [...items.values()]
        .filter((item) => item.category === category)
        .map((item) => ({
          name: mostUsedSpelling(item.spellings),
          quantity: roundQuantity(item.quantity),
          unit: item.unit,
          usedIn: item.usedIn,
        }))
        .sort(byName),
    }))
    .filter((section) => section.items.length > 0)
}
