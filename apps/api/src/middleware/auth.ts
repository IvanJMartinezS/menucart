import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../env.ts'
import {
  type Account,
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
  validateSessionToken,
} from '../lib/sessions.ts'

/** Environment of the routes that need a session: the signed-in user is always there. */
export type AuthEnv = {
  Bindings: AppEnv['Bindings']
  Variables: AppEnv['Variables'] & { account: Account }
}

/** Answers 401 unless the request has a valid session cookie. */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const token = getSessionToken(c)
  const session = token ? await validateSessionToken(c.var.db, token) : null

  if (!token || !session) {
    // A cookie that no longer works is removed, so the browser stops sending it.
    if (token) {
      clearSessionCookie(c)
    }
    throw new HTTPException(401, { message: 'You need to sign in' })
  }

  if (session.renewed) {
    setSessionCookie(c, token, session.expiresAt)
  }

  c.set('account', session.account)
  await next()
})
