import { cors as honoCors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../env.ts'

/**
 * Allows browsers to call the API only from the web app origins listed in `CORS_ORIGIN`
 * (comma separated). Any other website gets no CORS headers, so the browser blocks the response.
 */
export const cors = createMiddleware<AppEnv>((c, next) => {
  const allowedOrigins = c.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())

  return honoCors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type'],
    maxAge: 600,
  })(c, next)
})
