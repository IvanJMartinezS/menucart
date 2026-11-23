import { and, eq, gt, lt, sql } from 'drizzle-orm'
import type { Context, Input } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Database } from '../db/client.ts'
import { failedAttempts } from '../db/schema.ts'
import type { AppEnv } from '../env.ts'

/** Failed attempts allowed per client within the window, a common limit for codes and logins. */
export const MAX_FAILED_ATTEMPTS = 5

/** How long a failed attempt counts. */
export const FAILED_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000

/**
 * The window as a Postgres interval. Every time calculation is done by the database, which
 * also dates the attempts: the clocks of the API and the database are never exactly the same.
 */
const window = sql.raw(`interval '${FAILED_ATTEMPTS_WINDOW_MS / 1000} seconds'`)

export type LimitedAction = 'invitation' | 'login' | 'password'

/**
 * Who is trying. Cloudflare sets `CF-Connecting-IP` to the real address of the client and
 * replaces any value the client sends, so it cannot be faked once deployed.
 */
export const clientOf = (c: Context) => c.req.header('CF-Connecting-IP') ?? 'unknown'

/**
 * Answers 429 Too Many Requests when the client has failed the action too many times lately,
 * telling in `Retry-After` how many seconds to wait until the oldest failure stops counting.
 * The client is the IP address, unless another one is given (for example, an account).
 */
export async function rejectIfTooManyFailures<E extends AppEnv, P extends string, I extends Input>(
  c: Context<E, P, I>,
  action: LimitedAction,
  client = clientOf(c),
) {
  const [recent] = await c.var.db
    .select({
      failures: sql<number>`count(*)::int`,
      secondsLeft: sql<
        number | null
      >`ceil(extract(epoch from min(${failedAttempts.createdAt}) + ${window} - now()))::int`,
    })
    .from(failedAttempts)
    .where(
      and(
        eq(failedAttempts.action, action),
        eq(failedAttempts.client, client),
        gt(failedAttempts.createdAt, sql`now() - ${window}`),
      ),
    )

  if (recent && recent.failures >= MAX_FAILED_ATTEMPTS) {
    c.header('Retry-After', String(Math.max(1, recent.secondsLeft ?? 1)))
    throw new HTTPException(429, { message: 'Too many failed attempts. Try again later' })
  }
}

/** Counts a failed attempt and deletes the ones that no longer count, so the table stays small. */
export async function recordFailedAttempt(db: Database, client: string, action: LimitedAction) {
  await db.insert(failedAttempts).values({ action, client })
  await db.delete(failedAttempts).where(lt(failedAttempts.createdAt, sql`now() - ${window}`))
}
