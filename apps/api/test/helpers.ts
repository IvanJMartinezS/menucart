import postgres from 'postgres'
import app from '../src/index.ts'
import {
  generateSessionToken,
  hashSessionToken,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
} from '../src/lib/sessions.ts'
import { TEST_DATABASE_URL } from './database.ts'

const env = { DATABASE_URL: TEST_DATABASE_URL, CORS_ORIGIN: 'http://localhost:5173' }

/** Minimal stand-in for the Workers execution context, which does not exist outside Cloudflare. */
const executionCtx = {
  waitUntil: (promise: Promise<unknown>) => void promise,
  passThroughOnException: () => {},
  props: {},
} as ExecutionContext

/** Session sent with every request after `resetDatabaseAndSignIn`, unless a test sends its own. */
let defaultSessionToken: string | undefined

/** Adds the default session cookie, unless there is none or the request already has a cookie. */
function withDefaultSession(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers)

  if (defaultSessionToken && !headers.has('Cookie')) {
    headers.set('Cookie', `${SESSION_COOKIE}=${defaultSessionToken}`)
  }

  return { ...init, headers }
}

/** Sends a request to the API in memory, without starting a server. */
export const request = (path: string, init?: RequestInit) =>
  app.request(path, withDefaultSession(init), env, executionCtx)

const sendJson = (method: 'POST' | 'PUT', path: string, body: unknown, init?: RequestInit) =>
  request(path, {
    ...init,
    method,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    body: JSON.stringify(body),
  })

export const postJson = (path: string, body: unknown, init?: RequestInit) =>
  sendJson('POST', path, body, init)

export const putJson = (path: string, body: unknown, init?: RequestInit) =>
  sendJson('PUT', path, body, init)

/** Headers to send a request with the session of another account. */
export const sessionHeaders = (token: string) => ({ Cookie: `${SESSION_COOKIE}=${token}` })

/** Runs SQL directly against the test database, to check or prepare what the API cannot show. */
export async function queryDatabase<T>(run: (sql: postgres.Sql) => Promise<T>) {
  const sql = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} })

  try {
    return await run(sql)
  } finally {
    await sql.end()
  }
}

/**
 * Creates an account with its own household and a session, straight in the database:
 * hashing a real password on every test would make the tests much slower.
 */
export async function createTestAccount(name: string) {
  const token = generateSessionToken()
  const tokenHash = await hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  const { householdId, userId } = await queryDatabase(async (sql) => {
    const [household] = await sql<{ id: string }[]>`
      insert into households (name) values (${name}) returning id`
    const [user] = await sql<{ id: string }[]>`
      insert into users (household_id, email, name, password_hash)
      values (${household!.id}, ${`${name.toLowerCase()}@test.example`}, ${name}, 'not-used')
      returning id`
    await sql`
      insert into sessions (user_id, token_hash, expires_at)
      values (${user!.id}, ${tokenHash}, ${expiresAt})`

    return { householdId: household!.id, userId: user!.id }
  })

  return { token, householdId, userId }
}

/** Empties every table so each test starts from a clean database, without a default session. */
export async function resetDatabase() {
  defaultSessionToken = undefined
  await queryDatabase(
    (sql) => sql`truncate table plans, menus, groceries, households, failed_attempts cascade`,
  )
}

/** Empties the database and signs in as a new account: later requests use its session. */
export async function resetDatabaseAndSignIn() {
  await resetDatabase()
  const account = await createTestAccount('Ana')
  defaultSessionToken = account.token
  return account
}
