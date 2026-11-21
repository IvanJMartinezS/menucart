import { and, asc, eq, gt, lt } from 'drizzle-orm'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Database } from '../db/client.ts'
import { failedAttempts } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'

/** Failed attempts allowed per client within the window, a common limit for codes and logins. */
export const MAX_FAILED_ATTEMPTS = 5

/** How long a failed attempt counts. */
export const FAILED_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000

export type LimitedAction = 'invitation' | 'login'

/**
 * Who is trying. Cloudflare sets `CF-Connecting-IP` to the real address of the client and
 * replaces any value the client sends, so it cannot be faked once deployed.
 */
export const clientOf = (c: Context) => c.req.header('CF-Connecting-IP') ?? 'unknown'

/**
 * Answers 429 Too Many Requests when the client has failed the action too many times lately,
 * telling in `Retry-After` how many seconds to wait until the oldest failure stops counting.
 */
export async function rejectIfTooManyFailures(c: Context<AppEnv>, action: LimitedAction) {
  const now = Date.now()

  const failures = await c.var.db
    .select({ createdAt: failedAttempts.createdAt })
    .from(failedAttempts)
    .where(
      and(
        eq(failedAttempts.action, action),
        eq(failedAttempts.client, clientOf(c)),
        gt(failedAttempts.createdAt, new Date(now - FAILED_ATTEMPTS_WINDOW_MS)),
      ),
    )
    .orderBy(asc(failedAttempts.createdAt))
    .limit(MAX_FAILED_ATTEMPTS)

  if (failures.length >= MAX_FAILED_ATTEMPTS) {
    const oldest = failures[0]!.createdAt.getTime()
    const retryAfter = Math.max(1, Math.ceil((oldest + FAILED_ATTEMPTS_WINDOW_MS - now) / 1000))

    c.header('Retry-After', String(retryAfter))
    throw new HTTPException(429, { message: 'Too many failed attempts. Try again later' })
  }
}

/** Counts a failed attempt and deletes the ones that no longer count, so the table stays small. */
export async function recordFailedAttempt(db: Database, client: string, action: LimitedAction) {
  await db.insert(failedAttempts).values({ action, client })
  await db
    .delete(failedAttempts)
    .where(lt(failedAttempts.createdAt, new Date(Date.now() - FAILED_ATTEMPTS_WINDOW_MS)))
}
