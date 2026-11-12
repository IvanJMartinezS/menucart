import { groceryInputSchema } from '@menucart/shared'
import { asc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { groceries } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'
import { isUniqueViolation } from '../lib/db-errors.ts'
import { validateJson, validateParams } from '../lib/validation.ts'

const groceryIdParamSchema = z.object({ id: z.uuid() })

const groceryNotFound = () => new HTTPException(404, { message: 'Grocery not found' })

const duplicateGrocery = () =>
  new HTTPException(409, { message: 'A grocery with this name already exists' })

/**
 * Runs a write and turns a duplicate name into a clear 409 Conflict,
 * instead of a generic 500 error.
 */
async function rejectingDuplicates<T>(write: () => Promise<T>) {
  try {
    return await write()
  } catch (error) {
    if (isUniqueViolation(error, 'groceries_name_unique')) {
      throw duplicateGrocery()
    }
    throw error
  }
}

export const groceriesRoutes = new Hono<AppEnv>()
  /** Lists every grocery, grouped by category and sorted by name. */
  .get('/', async (c) => {
    const result = await c.var.db
      .select()
      .from(groceries)
      .orderBy(asc(groceries.category), asc(sql`lower(${groceries.name})`))

    return c.json(result)
  })

  /** Returns one grocery. */
  .get('/:id', validateParams(groceryIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    const [grocery] = await c.var.db.select().from(groceries).where(eq(groceries.id, id))

    if (!grocery) {
      throw groceryNotFound()
    }

    return c.json(grocery)
  })

  /** Creates a grocery. Answers 409 when another one already has the same name. */
  .post('/', validateJson(groceryInputSchema), async (c) => {
    const input = c.req.valid('json')

    const [created] = await rejectingDuplicates(() =>
      c.var.db.insert(groceries).values(input).returning(),
    )

    if (!created) {
      throw new Error('The grocery was not created')
    }

    return c.json(created, 201)
  })

  /** Replaces a grocery. Answers 409 when another one already has the new name. */
  .put(
    '/:id',
    validateParams(groceryIdParamSchema),
    validateJson(groceryInputSchema),
    async (c) => {
      const { id } = c.req.valid('param')
      const input = c.req.valid('json')

      const [updated] = await rejectingDuplicates(() =>
        c.var.db.update(groceries).set(input).where(eq(groceries.id, id)).returning(),
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
      .where(eq(groceries.id, id))
      .returning({ id: groceries.id })

    if (deleted.length === 0) {
      throw groceryNotFound()
    }

    return c.body(null, 204)
  })
