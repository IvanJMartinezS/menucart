import { z } from 'zod'

/** Shopping list sections an ingredient of a menu can belong to. */
export const ingredientCategories = ['meat', 'vegetables'] as const

export const ingredientCategorySchema = z.enum(ingredientCategories)

export type IngredientCategory = z.infer<typeof ingredientCategorySchema>

/** Matches the database column `numeric(8, 2)`: up to 999999.99 with two decimals. */
const MAX_QUANTITY = 999_999.99

export const menuIngredientInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  quantity: z.number().positive().max(MAX_QUANTITY).multipleOf(0.01),
  category: ingredientCategorySchema,
})

export type MenuIngredientInput = z.infer<typeof menuIngredientInputSchema>

/**
 * Data needed to create or update a menu.
 * The order of `ingredients` is kept: it becomes each ingredient's position.
 */
export const menuInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(500).optional(),
  ingredients: z.array(menuIngredientInputSchema).min(1).max(50),
})

export type MenuInput = z.infer<typeof menuInputSchema>
