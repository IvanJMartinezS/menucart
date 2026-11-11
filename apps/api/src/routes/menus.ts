import { menuInputSchema } from '@menucart/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { Database } from '../db/client.ts'
import { menuIngredients, menus } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'
import { validateJson, validateParams } from '../lib/validation.ts'

const menuIdParamSchema = z.object({ id: z.uuid() })

const ingredientColumns = {
  id: menuIngredients.id,
  name: menuIngredients.name,
  quantity: menuIngredients.quantity,
  category: menuIngredients.category,
  position: menuIngredients.position,
}

/** Loads the ingredients of each menu, in the order they were written. */
const withIngredients = {
  ingredients: {
    columns: { menuId: false },
    orderBy: (ingredient, { asc }) => [asc(ingredient.position)],
  },
} as const satisfies NonNullable<Parameters<Database['query']['menus']['findMany']>[0]>['with']

const menuNotFound = () => new HTTPException(404, { message: 'Menu not found' })

export const menusRoutes = new Hono<AppEnv>()
  /** Lists every menu with its ingredients, newest first. */
  .get('/', async (c) => {
    const result = await c.var.db.query.menus.findMany({
      orderBy: (menu, { desc }) => [desc(menu.createdAt)],
      with: withIngredients,
    })

    return c.json(result)
  })

  /** Returns one menu with its ingredients. */
  .get('/:id', validateParams(menuIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    const menu = await c.var.db.query.menus.findFirst({
      where: eq(menus.id, id),
      with: withIngredients,
    })

    if (!menu) {
      throw menuNotFound()
    }

    return c.json(menu)
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
