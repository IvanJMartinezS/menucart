import type { AppEnv } from '../env.ts'

/** The web app origins listed in `CORS_ORIGIN` (comma separated). */
export const allowedOrigins = (env: AppEnv['Bindings']) =>
  env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
