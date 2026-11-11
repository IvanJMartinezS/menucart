import { menuInputSchema } from '@menucart/shared'
import { Hono } from 'hono'
import { menuIngredients, menus } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'
import { validateJson } from '../lib/validation.ts'

const ingredientColumns = {
  id: menuIngredients.id,
  name: menuIngredients.name,
  quantity: menuIngredients.quantity,
  category: menuIngredients.category,
  position: menuIngredients.position,
}

export const menusRoutes = new Hono<AppEnv>()
  /** Lists every menu with its ingredients, newest first. */
  .get('/', async (c) => {
    const result = await c.var.db.query.menus.findMany({
      orderBy: (menu, { desc }) => [desc(menu.createdAt)],
      with: {
        ingredients: {
          columns: { menuId: false },
          orderBy: (ingredient, { asc }) => [asc(ingredient.position)],
        },
      },
    })

    return c.json(result)
  })

  /** Creates a menu and its ingredients in a single transaction: all or nothing. */
  .post('/', validateJson(menuInputSchema), async (c) => {
    const input = c.req.valid('json')

    const menu = await c.var.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(menus)
        .values({ name: input.name, notes: input.notes })
        .returning()

      if (!created) {
        throw new Error('The menu was not created')
      }

      const ingredients = await tx
        .insert(menuIngredients)
        .values(
          input.ingredients.map((ingredient, position) => ({
            ...ingredient,
            menuId: created.id,
            position,
          })),
        )
        .returning(ingredientColumns)

      return { ...created, ingredients }
    })

    return c.json(menu, 201)
  })
