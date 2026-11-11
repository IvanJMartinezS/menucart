import type { Database } from './db/client.ts'

/** Hono environment: bindings and variables available to the API. */
export type AppEnv = {
  Bindings: {
    DATABASE_URL: string
  }
  Variables: {
    /** Database client for the current request, set by the `database` middleware. */
    db: Database
  }
}
