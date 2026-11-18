import {
  buildShoppingList,
  planGroceryInputSchema,
  planInputSchema,
  planMenuInputSchema,
  suggestNextPlan,
} from '@menucart/shared'
import { and, asc, desc, eq, gte, isNull, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { Database } from '../db/client.ts'
import { groceries, menus, planGroceries, planMenus, plans } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'
import { isConstraintViolation } from '../lib/db-errors.ts'
import { validateJson, validateParams, validateQuery } from '../lib/validation.ts'

/**
 * "Today" is sent by the web app, in the user's own calendar: the server runs in UTC, where
 * 9 p.m. in Venezuela is already the next day.
 */
const todayQuerySchema = z.object({ today: z.iso.date() })

const planIdParamSchema = z.object({ id: z.uuid() })
const planMenuParamSchema = z.object({ id: z.uuid(), menuId: z.uuid() })
const planGroceryParamSchema = z.object({ id: z.uuid(), groceryId: z.uuid() })

const planNotFound = () => new HTTPException(404, { message: 'Plan not found' })
const overlappingPlan = () =>
  new HTTPException(409, { message: 'This plan overlaps the dates of another plan' })

/** Runs a write and turns overlapping dates into a clear 409 Conflict. */
async function rejectingOverlaps<T>(write: () => Promise<T>) {
  try {
    return await write()
  } catch (error) {
    if (isConstraintViolation(error, 'plans_no_overlap')) {
      throw overlappingPlan()
    }
    throw error
  }
}

/** A plan with its menus (and their ingredients) and its groceries. */
async function findPlan(db: Database, id: string) {
  const plan = await db.query.plans.findFirst({
    where: eq(plans.id, id),
    with: {
      menus: {
        columns: { menuId: true, times: true },
        orderBy: (planMenu, { asc }) => [asc(planMenu.addedAt)],
        with: {
          menu: {
            columns: { id: true, name: true, archivedAt: true },
            with: {
              ingredients: {
                columns: { menuId: false },
                orderBy: (ingredient, { asc }) => [asc(ingredient.position)],
              },
            },
          },
        },
      },
      groceries: {
        columns: { planId: false, addedAt: false },
        orderBy: (planGrocery) => [asc(planGrocery.category), asc(sql`lower(${planGrocery.name})`)],
      },
    },
  })

  if (!plan) {
    throw planNotFound()
  }
  return plan
}

async function ensurePlanExists(db: Database, id: string) {
  const [plan] = await db.select({ id: plans.id }).from(plans).where(eq(plans.id, id))
  if (!plan) {
    throw planNotFound()
  }
}

export const plansRoutes = new Hono<AppEnv>()
  /** Every plan, newest first, with how many menus and groceries it has (the history). */
  .get('/', async (c) => {
    const result = await c.var.db
      .select({
        id: plans.id,
        startDate: plans.startDate,
        endDate: plans.endDate,
        createdAt: plans.createdAt,
        // Written with explicit table names: Drizzle would write `"plan_id" = "id"`, and inside
        // the subquery Postgres would read `"id"` as the subquery's own column, not the plan's.
        menuCount: sql<number>`(select coalesce(sum(plan_menus.times), 0)::int from plan_menus where plan_menus.plan_id = plans.id)`,
        groceryCount: sql<number>`(select count(*)::int from plan_groceries where plan_groceries.plan_id = plans.id)`,
      })
      .from(plans)
      .orderBy(desc(plans.startDate))

    return c.json(result)
  })

  /**
   * The plan the user is in: the one that contains `today`, or else the next one created in
   * advance. `null` when there is none, so the web app can offer to create it.
   */
  .get('/current', validateQuery(todayQuerySchema), async (c) => {
    const { today } = c.req.valid('query')

    const [current] = await c.var.db
      .select({ id: plans.id })
      .from(plans)
      .where(gte(plans.endDate, today))
      .orderBy(asc(plans.startDate))
      .limit(1)

    return c.json(current ? await findPlan(c.var.db, current.id) : null)
  })

  /** Dates proposed for a new plan: the day after the last plan, lasting 15 days. */
  .get('/suggestion', validateQuery(todayQuerySchema), async (c) => {
    const { today } = c.req.valid('query')

    const [latest] = await c.var.db
      .select({ startDate: plans.startDate, endDate: plans.endDate })
      .from(plans)
      .orderBy(desc(plans.endDate))
      .limit(1)

    return c.json(suggestNextPlan(today, latest))
  })

  /** One plan with its menus and groceries. */
  .get('/:id', validateParams(planIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    return c.json(await findPlan(c.var.db, id))
  })

  /**
   * The shopping list of a plan: menu ingredients multiplied and added up, and the checked
   * groceries, grouped by section. The rules live in the shared package (`buildShoppingList`).
   */
  .get('/:id/shopping-list', validateParams(planIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const plan = await findPlan(c.var.db, id)

    return c.json({
      planId: plan.id,
      startDate: plan.startDate,
      endDate: plan.endDate,
      sections: buildShoppingList({ menus: plan.menus, groceries: plan.groceries }),
    })
  })

  /**
   * Creates a plan with the chosen dates. Biweekly groceries start checked, with their usual
   * quantity. Answers 409 when the dates overlap another plan.
   */
  .post('/', validateJson(planInputSchema), async (c) => {
    const input = c.req.valid('json')

    const id = await rejectingOverlaps(() =>
      c.var.db.transaction(async (tx) => {
        const [created] = await tx.insert(plans).values(input).returning({ id: plans.id })
        if (!created) {
          throw new Error('The plan was not created')
        }

        const biweekly = await tx
          .select()
          .from(groceries)
          .where(eq(groceries.frequency, 'biweekly'))
        if (biweekly.length > 0) {
          await tx.insert(planGroceries).values(
            biweekly.map((grocery) => ({
              planId: created.id,
              groceryId: grocery.id,
              name: grocery.name,
              category: grocery.category,
              unit: grocery.unit,
              quantity: grocery.defaultQuantity,
            })),
          )
        }

        return created.id
      }),
    )

    return c.json(await findPlan(c.var.db, id), 201)
  })

  /** Changes the dates of a plan. Answers 409 when the new dates overlap another plan. */
  .put('/:id', validateParams(planIdParamSchema), validateJson(planInputSchema), async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')

    const [updated] = await rejectingOverlaps(() =>
      c.var.db.update(plans).set(input).where(eq(plans.id, id)).returning({ id: plans.id }),
    )
    if (!updated) {
      throw planNotFound()
    }

    return c.json(await findPlan(c.var.db, id))
  })

  /** Deletes a plan with its chosen menus and groceries. The menus and groceries themselves stay. */
  .delete('/:id', validateParams(planIdParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    const deleted = await c.var.db.delete(plans).where(eq(plans.id, id)).returning({ id: plans.id })
    if (deleted.length === 0) {
      throw planNotFound()
    }

    return c.body(null, 204)
  })

  /** Adds a menu to the plan, or changes how many times it is planned. */
  .put(
    '/:id/menus/:menuId',
    validateParams(planMenuParamSchema),
    validateJson(planMenuInputSchema),
    async (c) => {
      const { id, menuId } = c.req.valid('param')
      const { times } = c.req.valid('json')

      await ensurePlanExists(c.var.db, id)
      // Archived menus are no longer in the catalog, so they cannot be planned again.
      const [menu] = await c.var.db
        .select({ id: menus.id })
        .from(menus)
        .where(and(eq(menus.id, menuId), isNull(menus.archivedAt)))
      if (!menu) {
        throw new HTTPException(404, { message: 'Menu not found' })
      }

      const [planned] = await c.var.db
        .insert(planMenus)
        .values({ planId: id, menuId, times })
        .onConflictDoUpdate({ target: [planMenus.planId, planMenus.menuId], set: { times } })
        .returning({ menuId: planMenus.menuId, times: planMenus.times })

      return c.json(planned)
    },
  )

  /** Removes a menu from the plan. */
  .delete('/:id/menus/:menuId', validateParams(planMenuParamSchema), async (c) => {
    const { id, menuId } = c.req.valid('param')

    const deleted = await c.var.db
      .delete(planMenus)
      .where(and(eq(planMenus.planId, id), eq(planMenus.menuId, menuId)))
      .returning({ menuId: planMenus.menuId })
    if (deleted.length === 0) {
      throw new HTTPException(404, { message: 'This menu is not in the plan' })
    }

    return c.body(null, 204)
  })

  /**
   * Checks a grocery in the plan with the quantity to buy, or changes that quantity.
   * Its name, category and unit are copied from the catalog when it is first checked.
   */
  .put(
    '/:id/groceries/:groceryId',
    validateParams(planGroceryParamSchema),
    validateJson(planGroceryInputSchema),
    async (c) => {
      const { id, groceryId } = c.req.valid('param')
      const { quantity } = c.req.valid('json')

      await ensurePlanExists(c.var.db, id)
      const [grocery] = await c.var.db.select().from(groceries).where(eq(groceries.id, groceryId))
      if (!grocery) {
        throw new HTTPException(404, { message: 'Grocery not found' })
      }

      const [checked] = await c.var.db
        .insert(planGroceries)
        .values({
          planId: id,
          groceryId,
          name: grocery.name,
          category: grocery.category,
          unit: grocery.unit,
          quantity,
        })
        .onConflictDoUpdate({
          target: [planGroceries.planId, planGroceries.groceryId],
          set: { quantity },
        })
        .returning({
          id: planGroceries.id,
          groceryId: planGroceries.groceryId,
          name: planGroceries.name,
          category: planGroceries.category,
          unit: planGroceries.unit,
          quantity: planGroceries.quantity,
        })

      return c.json(checked)
    },
  )

  /** Unchecks a grocery: it will not be bought in this plan. */
  .delete('/:id/groceries/:groceryId', validateParams(planGroceryParamSchema), async (c) => {
    const { id, groceryId } = c.req.valid('param')

    const deleted = await c.var.db
      .delete(planGroceries)
      .where(and(eq(planGroceries.planId, id), eq(planGroceries.groceryId, groceryId)))
      .returning({ id: planGroceries.id })
    if (deleted.length === 0) {
      throw new HTTPException(404, { message: 'This grocery is not in the plan' })
    }

    return c.body(null, 204)
  })
