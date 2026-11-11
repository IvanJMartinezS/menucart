import { type MenuIngredientInput, menuInputSchema } from '@menucart/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { Database } from '../db/client.ts'
import { menuIngredients, menus } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'
import { validateJson, validateParams } from '../lib/validation.ts'

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

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

/** Saves the ingredients of a menu, keeping their order as `position`. */
const insertIngredients = (tx: Transaction, menuId: string, ingredients: MenuIngredientInput[]) =>
  tx
    .insert(menuIngredients)
    .values(ingredients.map((ingredient, position) => ({ ...ingredient, menuId, position })))
    .returning(ingredientColumns)

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

      const ingredients = await insertIngredients(tx, created.id, input.ingredients)

      return { ...created, ingredients }
    })

    return c.json(menu, 201)
  })

  /**
   * Replaces a menu: name, notes and the whole list of ingredients.
   * Notes that are not sent are cleared, because PUT sends the complete menu.
   */
  .put('/:id', validateParams(menuIdParamSchema), validateJson(menuInputSchema), async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')

    const menu = await c.var.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(menus)
        .set({ name: input.name, notes: input.notes ?? null })
        .where(eq(menus.id, id))
        .returning()

      if (!updated) {
        return undefined
      }

      await tx.delete(menuIngredients).where(eq(menuIngredients.menuId, id))
      const ingredients = await insertIngredients(tx, id, input.ingredients)

      return { ...updated, ingredients }
    })

    if (!menu) {
      throw menuNotFound()
    }

    return c.json(menu)
  })

  /** Deletes a menu. Its ingredients are deleted by the database (`ON DELETE CASCADE`). */
  .delete('/:id', validateParams(menuIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    const deleted = await c.var.db.delete(menus).where(eq(menus.id, id)).returning({ id: menus.id })

    if (deleted.length === 0) {
      throw menuNotFound()
    }

    return c.body(null, 204)
  })
