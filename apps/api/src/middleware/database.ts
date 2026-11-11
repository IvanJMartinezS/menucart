import { createMiddleware } from 'hono/factory'
import { createDb } from '../db/client.ts'
import type { AppEnv } from '../env.ts'

/** Opens a database client for the request and closes it once the response is sent. */
export const database = createMiddleware<AppEnv>(async (c, next) => {
  const { db, close } = createDb(c.env.DATABASE_URL)
  c.set('db', db)

  try {
    await next()
  } finally {
    c.executionCtx.waitUntil(close())
  }
})
