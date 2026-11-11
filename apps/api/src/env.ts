import type { Database } from './db/client.ts'

/** Hono environment: bindings and variables available to the API. */
export type AppEnv = {
  Bindings: {
    DATABASE_URL: string
    /** Web app origins allowed to call the API from a browser, comma separated. */
    CORS_ORIGIN: string
  }
  Variables: {
    /** Database client for the current request, set by the `database` middleware. */
    db: Database
  }
}
