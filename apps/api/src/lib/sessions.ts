import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { CookieOptions } from 'hono/utils/cookie'
import type { Database, Executor } from '../db/client.ts'
import { households, sessions, users } from '../db/schema.ts'
import { sha256Hex, toBase64Url } from './encoding.ts'

export const SESSION_COOKIE = 'menucart_session'

const DAY_MS = 24 * 60 * 60 * 1000

/** How long a session lasts without being used. */
export const SESSION_DURATION_MS = 30 * DAY_MS

/** A session used with less than this time left is extended, so devices in use stay signed in. */
export const SESSION_RENEW_THRESHOLD_MS = 15 * DAY_MS

const TOKEN_BYTES = 32

/** The signed-in user, as the API returns it. */
export type Account = {
  id: string
  name: string
  email: string
  household: { id: string; name: string }
}

/** A new random session token: 32 bytes from a secure generator, impossible to guess. */
export function generateSessionToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)))
}

/** SHA-256 of the token: the only thing saved in the database. */
export const hashSessionToken = (token: string) => sha256Hex(token)

/**
 * Starts a session for the user and returns the token, which only the browser keeps.
 * It can run inside a transaction, to replace the sessions of a user all at once.
 */
export async function createSession(db: Executor, userId: string) {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.insert(sessions).values({ userId, tokenHash: await hashSessionToken(token), expiresAt })

  return { token, expiresAt }
}

/**
 * Finds the user of a session token. Expired sessions are deleted and give null.
 * Sessions close to expiring are extended (`renewed`), so the cookie must be sent again.
 */
export async function validateSessionToken(db: Database, token: string) {
  const [session] = await db
    .select({
      id: sessions.id,
      expiresAt: sessions.expiresAt,
      user: { id: users.id, name: users.name, email: users.email },
      household: { id: households.id, name: households.name },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(households, eq(users.householdId, households.id))
    .where(eq(sessions.tokenHash, await hashSessionToken(token)))

  if (!session) {
    return null
  }

  const now = Date.now()

  if (session.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, session.id))
    return null
  }

  let { expiresAt } = session
  const renewed = expiresAt.getTime() - now < SESSION_RENEW_THRESHOLD_MS

  if (renewed) {
    expiresAt = new Date(now + SESSION_DURATION_MS)
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, session.id))
  }

  const account: Account = { ...session.user, household: session.household }
  return { account, expiresAt, renewed }
}

/** Ends the session of the token, if it exists. */
export async function deleteSession(db: Database, token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, await hashSessionToken(token)))
}

/**
 * The cookie cannot be read by JavaScript (`httpOnly`), only travels over HTTPS (`secure`)
 * and is not sent with requests started by other websites (`sameSite`).
 */
const cookieOptions: CookieOptions = { httpOnly: true, secure: true, sameSite: 'Lax', path: '/' }

export const getSessionToken = (c: Context) => getCookie(c, SESSION_COOKIE)

export function setSessionCookie(c: Context, token: string, expiresAt: Date) {
  setCookie(c, SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt })
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, cookieOptions)
}
