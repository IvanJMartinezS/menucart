import { type MenuIngredientInput, menuInputSchema } from '@menucart/shared'
import { and, eq, getTableColumns, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { Database, Transaction } from '../db/client.ts'
import { menuIngredients, menus } from '../db/schema.ts'
import { isConstraintViolation } from '../lib/db-errors.ts'
import { validateJson, validateParams } from '../lib/validation.ts'
import { type AuthEnv, requireAuth } from '../middleware/auth.ts'

const menuIdParamSchema = z.object({ id: z.uuid() })

/** Columns sent to the web app: all but the household, which is always the user's own. */
const { householdId: _householdId, ...menuColumns } = getTableColumns(menus)

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

/** The menu with this id, only if it belongs to the household. */
const ownMenu = (householdId: string, id: string) =>
  and(eq(menus.id, id), eq(menus.householdId, householdId))

/** Saves the ingredients of a menu, keeping their order as `position`. */
const insertIngredients = (tx: Transaction, menuId: string, ingredients: MenuIngredientInput[]) =>
  tx
    .insert(menuIngredients)
    .values(ingredients.map((ingredient, position) => ({ ...ingredient, menuId, position })))
    .returning(ingredientColumns)

/** The menus of the signed-in user's household. A menu of another household answers 404. */
export const menusRoutes = new Hono<AuthEnv>()
  .use(requireAuth)

  /** Lists the menus of the catalog with their ingredients, newest first. Archived ones are left out. */
  .get('/', async (c) => {
    const result = await c.var.db.query.menus.findMany({
      columns: { householdId: false },
      where: and(eq(menus.householdId, c.var.account.household.id), isNull(menus.archivedAt)),
      orderBy: (menu, { desc }) => [desc(menu.createdAt)],
      with: withIngredients,
    })

    return c.json(result)
  })

  /** Returns one menu with its ingredients. */
  .get('/:id', validateParams(menuIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    const menu = await c.var.db.query.menus.findFirst({
      columns: { householdId: false },
      where: ownMenu(c.var.account.household.id, id),
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
        .values({
          householdId: c.var.account.household.id,
          name: input.name,
          notes: input.notes,
        })
        .returning(menuColumns)

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
        .where(ownMenu(c.var.account.household.id, id))
        .returning(menuColumns)

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

  /**
   * Removes a menu from the catalog.
   * - Never used in a plan: it is deleted, with its ingredients (`ON DELETE CASCADE`).
   * - Used in a plan: the database refuses to delete it (`ON DELETE RESTRICT`), so it is
   *   archived instead. Plans keep it, and it no longer shows up in the catalog.
   */
  .delete('/:id', validateParams(menuIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const where = ownMenu(c.var.account.household.id, id)

    let removed: { id: string }[]
    try {
      removed = await c.var.db.delete(menus).where(where).returning({ id: menus.id })
    } catch (error) {
      if (!isConstraintViolation(error, 'plan_menus_menu_id_menus_id_fk')) {
        throw error
      }
      removed = await c.var.db
        .update(menus)
        .set({ archivedAt: new Date() })
        .where(where)
        .returning({ id: menus.id })
    }

    if (removed.length === 0) {
      throw menuNotFound()
    }

    return c.body(null, 204)
  })
