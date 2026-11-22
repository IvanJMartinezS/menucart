import { groceryInputSchema } from '@menucart/shared'
import { and, asc, eq, getTableColumns, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { groceries } from '../db/schema.ts'
import { isConstraintViolation } from '../lib/db-errors.ts'
import { validateJson, validateParams } from '../lib/validation.ts'
import { type AuthEnv, requireAuth } from '../middleware/auth.ts'

const groceryIdParamSchema = z.object({ id: z.uuid() })

/** Columns sent to the web app: all but the household, which is always the user's own. */
const { householdId: _householdId, ...groceryColumns } = getTableColumns(groceries)

const groceryNotFound = () => new HTTPException(404, { message: 'Grocery not found' })

const duplicateGrocery = () =>
  new HTTPException(409, { message: 'A grocery with this name already exists' })

/** The grocery with this id, only if it belongs to the household. */
const ownGrocery = (householdId: string, id: string) =>
  and(eq(groceries.id, id), eq(groceries.householdId, householdId))

/**
 * Runs a write and turns a duplicate name into a clear 409 Conflict,
 * instead of a generic 500 error.
 */
async function rejectingDuplicates<T>(write: () => Promise<T>) {
  try {
    return await write()
  } catch (error) {
    if (isConstraintViolation(error, 'groceries_name_unique')) {
      throw duplicateGrocery()
    }
    throw error
  }
}

/** The groceries of the signed-in user's household. A grocery of another household answers 404. */
export const groceriesRoutes = new Hono<AuthEnv>()
  .use(requireAuth)

  /** Lists every grocery, grouped by category and sorted by name. */
  .get('/', async (c) => {
    const result = await c.var.db
      .select(groceryColumns)
      .from(groceries)
      .where(eq(groceries.householdId, c.var.account.household.id))
      .orderBy(asc(groceries.category), asc(sql`lower(${groceries.name})`))

    return c.json(result)
  })

  /** Returns one grocery. */
  .get('/:id', validateParams(groceryIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    const [grocery] = await c.var.db
      .select(groceryColumns)
      .from(groceries)
      .where(ownGrocery(c.var.account.household.id, id))

    if (!grocery) {
      throw groceryNotFound()
    }

    return c.json(grocery)
  })

  /** Creates a grocery. Answers 409 when another one of the household has the same name. */
  .post('/', validateJson(groceryInputSchema), async (c) => {
    const input = c.req.valid('json')

    const [created] = await rejectingDuplicates(() =>
      c.var.db
        .insert(groceries)
        .values({ ...input, householdId: c.var.account.household.id })
        .returning(groceryColumns),
    )

    if (!created) {
      throw new Error('The grocery was not created')
    }

    return c.json(created, 201)
  })

  /** Replaces a grocery. Answers 409 when another one of the household has the new name. */
  .put(
    '/:id',
    validateParams(groceryIdParamSchema),
    validateJson(groceryInputSchema),
    async (c) => {
      const { id } = c.req.valid('param')
      const input = c.req.valid('json')

      const [updated] = await rejectingDuplicates(() =>
        c.var.db
          .update(groceries)
          .set(input)
          .where(ownGrocery(c.var.account.household.id, id))
          .returning(groceryColumns),
      )

      if (!updated) {
        throw groceryNotFound()
      }

      return c.json(updated)
    },
  )

  /** Deletes a grocery. */
  .delete('/:id', validateParams(groceryIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    const deleted = await c.var.db
      .delete(groceries)
      .where(ownGrocery(c.var.account.household.id, id))
      .returning({ id: groceries.id })

    if (deleted.length === 0) {
      throw groceryNotFound()
    }

    return c.body(null, 204)
  })
