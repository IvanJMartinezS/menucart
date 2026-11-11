import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { AppEnv } from './env.ts'
import { handleError, handleNotFound } from './lib/errors.ts'
import { database } from './middleware/database.ts'
import { ingredientsRoutes } from './routes/ingredients.ts'
import { menusRoutes } from './routes/menus.ts'

const app = new Hono<AppEnv>()

app.use(database)

app.get('/health', async (c) => {
  try {
    await c.var.db.execute(sql`select 1`)
    return c.json({ status: 'ok', database: 'up' })
  } catch {
    return c.json({ status: 'error', database: 'down' }, 503)
  }
})

app.route('/menus', menusRoutes)
app.route('/ingredients', ingredientsRoutes)

app.onError(handleError)
app.notFound(handleNotFound)

export default app
