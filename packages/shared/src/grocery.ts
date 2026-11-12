import { z } from 'zod'

/** Sections of the shopping list a grocery can belong to. Meat and vegetables come from menus. */
export const groceryCategories = ['pantry', 'deli'] as const

/** How often a grocery is usually bought. Biweekly ones start checked in every new plan. */
export const groceryFrequencies = ['biweekly', 'monthly', 'occasional'] as const

/** Units for the usual quantity, so the shopping list can say "2 kg" instead of just "2". */
export const groceryUnits = ['unit', 'kg', 'g', 'l', 'ml', 'package'] as const

export const groceryCategorySchema = z.enum(groceryCategories)
export const groceryFrequencySchema = z.enum(groceryFrequencies)
export const groceryUnitSchema = z.enum(groceryUnits)

export type GroceryCategory = z.infer<typeof groceryCategorySchema>
export type GroceryFrequency = z.infer<typeof groceryFrequencySchema>
export type GroceryUnit = z.infer<typeof groceryUnitSchema>

/** Matches the database column `numeric(8, 2)`: up to 999999.99 with two decimals. */
const MAX_QUANTITY = 999_999.99

/** Data needed to create or update a grocery. */
export const groceryInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: groceryCategorySchema,
  /** Amount usually bought each time, in `unit`. */
  defaultQuantity: z.number().positive().max(MAX_QUANTITY).multipleOf(0.01),
  unit: groceryUnitSchema,
  frequency: groceryFrequencySchema,
})

export type GroceryInput = z.infer<typeof groceryInputSchema>
