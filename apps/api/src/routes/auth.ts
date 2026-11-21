import { loginInputSchema, registerInputSchema } from '@menucart/shared'
import { eq, sql } from 'drizzle-orm'
import { type Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { households, users } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'
import { isConstraintViolation } from '../lib/db-errors.ts'
import { clientOf, recordFailedAttempt, rejectIfTooManyFailures } from '../lib/failed-attempts.ts'
import { claimInvitation, markInvitationUsedBy } from '../lib/invitations.ts'
import { hashPassword, verifyAgainstDummyHash, verifyPassword } from '../lib/passwords.ts'
import {
  type Account,
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionToken,
  setSessionCookie,
} from '../lib/sessions.ts'
import { validateJson } from '../lib/validation.ts'
import { requireAuth } from '../middleware/auth.ts'

/** The same answer for a wrong email and a wrong password, so emails cannot be guessed. */
const invalidCredentials = () =>
  new HTTPException(401, { message: 'The email or the password is not correct' })

/** Thrown inside the transaction to undo it when the invitation code does not work. */
class InvalidInvitationError extends Error {}

async function startSession(c: Context<AppEnv>, userId: string) {
  const { token, expiresAt } = await createSession(c.var.db, userId)
  setSessionCookie(c, token, expiresAt)
}

export const authRoutes = new Hono<AppEnv>()
  /**
   * Creates an account and signs in. Without an invitation code the user gets their own
   * household; with a valid one, they join the household that invited them.
   */
  .post('/register', validateJson(registerInputSchema), async (c) => {
    const { name, email, password, invitationCode } = c.req.valid('json')

    if (invitationCode) {
      await rejectIfTooManyFailures(c, 'invitation')
    }

    const passwordHash = await hashPassword(password)

    let account: Account
    try {
      account = await c.var.db.transaction(async (tx) => {
        const invitation = invitationCode ? await claimInvitation(tx, invitationCode) : null

        if (invitationCode && !invitation) {
          throw new InvalidInvitationError()
        }

        const [household] = invitation
          ? await tx
              .select({ id: households.id, name: households.name })
              .from(households)
              .where(eq(households.id, invitation.householdId))
          : await tx
              .insert(households)
              .values({ name })
              .returning({ id: households.id, name: households.name })
        const [user] = await tx
          .insert(users)
          .values({ householdId: household!.id, email, name, passwordHash })
          .returning({ id: users.id, name: users.name, email: users.email })

        if (invitation) {
          await markInvitationUsedBy(tx, invitation.id, user!.id)
        }

        return { ...user!, household: household! }
      })
    } catch (error) {
      if (error instanceof InvalidInvitationError) {
        // Counted outside the transaction, which was undone.
        await recordFailedAttempt(c.var.db, clientOf(c), 'invitation')
        throw new HTTPException(400, {
          message: 'The invitation code is not valid. It may have expired or been used already',
        })
      }
      if (isConstraintViolation(error, 'users_email_unique')) {
        throw new HTTPException(409, { message: 'An account with this email already exists' })
      }
      throw error
    }

    await startSession(c, account.id)
    return c.json(account, 201)
  })

  /** Signs in with email and password. Too many wrong passwords block the client for a while. */
  .post('/login', validateJson(loginInputSchema), async (c) => {
    const { email, password } = c.req.valid('json')

    await rejectIfTooManyFailures(c, 'login')

    const [user] = await c.var.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        household: { id: households.id, name: households.name },
      })
      .from(users)
      .innerJoin(households, eq(users.householdId, households.id))
      .where(eq(sql`lower(${users.email})`, email))

    const passwordIsValid = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyAgainstDummyHash(password)

    if (!user || !passwordIsValid) {
      await recordFailedAttempt(c.var.db, clientOf(c), 'login')
      throw invalidCredentials()
    }

    await startSession(c, user.id)

    const account: Account = {
      id: user.id,
      name: user.name,
      email: user.email,
      household: user.household,
    }
    return c.json(account, 200)
  })

  /** Signs out this device. Works even without a session, so it can always be called. */
  .post('/logout', async (c) => {
    const token = getSessionToken(c)

    if (token) {
      await deleteSession(c.var.db, token)
    }

    clearSessionCookie(c)
    return c.body(null, 204)
  })

  /** The signed-in user and their household. */
  .get('/me', requireAuth, (c) => c.json(c.var.account, 200))
