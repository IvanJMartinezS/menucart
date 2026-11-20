import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../env.ts'
import { allowedOrigins } from '../lib/origins.ts'

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Refuses writes started by other websites (cross-site request forgery). Browsers always say
 * where a write comes from with `Origin` or `Sec-Fetch-Site`, and websites cannot fake them.
 * Requests without those headers do not come from a browser, so there is no cookie to abuse.
 * It adds to the `SameSite` rule of the session cookie, in case an old browser ignores it.
 */
export const csrf = createMiddleware<AppEnv>(async (c, next) => {
  if (!safeMethods.has(c.req.method)) {
    const origin = c.req.header('Origin')
    const fetchSite = c.req.header('Sec-Fetch-Site')
    const fromOtherWebsite =
      origin === undefined ? fetchSite === 'cross-site' : !allowedOrigins(c.env).includes(origin)

    if (fromOtherWebsite) {
      throw new HTTPException(403, { message: 'Requests from other websites are not allowed' })
    }
  }

  await next()
})
