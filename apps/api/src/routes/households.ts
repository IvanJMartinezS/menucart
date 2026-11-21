import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { users } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'
import { createInvitation } from '../lib/invitations.ts'
import { requireAuth } from '../middleware/auth.ts'

export const householdsRoutes = new Hono<AppEnv>()
  /** The household of the signed-in user and the people who share it. */
  .get('/current', requireAuth, async (c) => {
    const { household } = c.var.account

    const members = await c.var.db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.householdId, household.id))
      .orderBy(asc(users.createdAt))

    return c.json({ ...household, members }, 200)
  })

  /**
   * Creates a code for someone to join the household when they register. It works once,
   * for 24 hours, and cancels the previous unused code.
   */
  .post('/invitations', requireAuth, async (c) => {
    const { id, household } = c.var.account
    const invitation = await createInvitation(c.var.db, household.id, id)

    return c.json(invitation, 201)
  })
