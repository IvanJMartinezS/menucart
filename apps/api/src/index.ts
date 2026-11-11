import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createDb } from './db/client.ts'
import type { AppEnv } from './env.ts'
import { handleError, handleNotFound } from './lib/errors.ts'

const app = new Hono<AppEnv>()

app.get('/health', async (c) => {
  const { db, close } = createDb(c.env.DATABASE_URL)

  try {
    await db.execute(sql`select 1`)
    return c.json({ status: 'ok', database: 'up' })
  } catch {
    return c.json({ status: 'error', database: 'down' }, 503)
  } finally {
    c.executionCtx.waitUntil(close())
  }
})

app.onError(handleError)
app.notFound(handleNotFound)

export default app
