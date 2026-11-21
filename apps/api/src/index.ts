import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { AppEnv } from './env.ts'
import { handleError, handleNotFound } from './lib/errors.ts'
import { cors } from './middleware/cors.ts'
import { csrf } from './middleware/csrf.ts'
import { database } from './middleware/database.ts'
import { authRoutes } from './routes/auth.ts'
import { groceriesRoutes } from './routes/groceries.ts'
import { householdsRoutes } from './routes/households.ts'
import { ingredientsRoutes } from './routes/ingredients.ts'
import { menusRoutes } from './routes/menus.ts'
import { plansRoutes } from './routes/plans.ts'

// Routes are chained so that `AppType` describes every endpoint for the typed web client.
const app = new Hono<AppEnv>()
  .use(cors)
  .use(csrf)
  .use(database)
  .get('/health', async (c) => {
    try {
      await c.var.db.execute(sql`select 1`)
      return c.json({ status: 'ok', database: 'up' } as const)
    } catch {
      return c.json({ status: 'error', database: 'down' } as const, 503)
    }
  })
  .route('/auth', authRoutes)
  .route('/households', householdsRoutes)
  .route('/menus', menusRoutes)
  .route('/ingredients', ingredientsRoutes)
  .route('/groceries', groceriesRoutes)
  .route('/plans', plansRoutes)

app.onError(handleError)
app.notFound(handleNotFound)

/** Type of the whole API, used by the web app to call it with full type safety. */
export type AppType = typeof app

export default app
