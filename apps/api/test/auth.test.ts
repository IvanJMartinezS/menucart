import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ErrorBody } from '../src/lib/errors.ts'
import { PASSWORD_ITERATIONS, verifyAgainstDummyHash } from '../src/lib/passwords.ts'
import {
  type Account,
  hashSessionToken,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
} from '../src/lib/sessions.ts'
import { postJson, queryDatabase, request, resetDatabase } from './helpers.ts'

// Spied on (it still runs) to know that a password is checked even when the email has no account.
vi.mock(import('../src/lib/passwords.ts'), async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, verifyAgainstDummyHash: vi.fn(actual.verifyAgainstDummyHash) }
})

const ana = { name: 'Ana', email: 'ana@mail.com', password: 'una clave larga' }

const DAY_MS = 24 * 60 * 60 * 1000

/** The `Set-Cookie` header of the session cookie, if the response has one. */
const sessionCookieOf = (response: Response) =>
  response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))

/** The session token sent to the browser. */
function sessionTokenOf(response: Response) {
  const token = sessionCookieOf(response)?.split(';')[0]?.split('=')[1]
  expect(token).toBeTruthy()
  return token!
}

const withSession = (token: string): RequestInit => ({
  headers: { Cookie: `${SESSION_COOKIE}=${token}` },
})

const register = async (body: object = ana) =>
  sessionTokenOf(await postJson('/auth/register', body))

const me = (token: string) => request('/auth/me', withSession(token))

const logout = (token: string) => request('/auth/logout', { method: 'POST', ...withSession(token) })

const countRows = (table: 'users' | 'households' | 'sessions') =>
  queryDatabase(async (sql) => {
    const [row] = await sql<{ count: number }[]>`select count(*)::int as count from ${sql(table)}`
    return row!.count
  })

const sessionExpiry = (token: string) =>
  queryDatabase(async (sql) => {
    const tokenHash = await hashSessionToken(token)
    const [row] = await sql<
      { expires_at: Date }[]
    >`select expires_at from sessions where token_hash = ${tokenHash}`
    return row?.expires_at
  })

const setSessionExpiry = (token: string, expiresAt: Date) =>
  queryDatabase(async (sql) => {
    const tokenHash = await hashSessionToken(token)
    await sql`update sessions set expires_at = ${expiresAt} where token_hash = ${tokenHash}`
  })

const expectedAccount: Account = {
  id: expect.any(String),
  name: 'Ana',
  email: 'ana@mail.com',
  household: { id: expect.any(String), name: 'Ana' },
}

beforeEach(resetDatabase)

describe('POST /auth/register', () => {
  it('creates the account with its own household and signs in', async () => {
    const response = await postJson('/auth/register', ana)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual(expectedAccount)

    const token = sessionTokenOf(response)
    expect(await (await me(token)).json()).toEqual(expectedAccount)
  })

  it('sends a session cookie that scripts cannot read and other websites cannot use', async () => {
    const response = await postJson('/auth/register', ana)
    const cookie = sessionCookieOf(response)

    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    expect(cookie).toMatch(/Expires=/)
  })

  it('saves a salted hash of the password, never the password itself', async () => {
    await register()
    await register({ ...ana, email: 'luis@mail.com' })

    const hashes = await queryDatabase(
      (sql) => sql<{ password_hash: string }[]>`
      select password_hash from users`,
    )

    for (const { password_hash } of hashes) {
      expect(password_hash).toMatch(new RegExp(`^pbkdf2-sha256\\$${PASSWORD_ITERATIONS}\\$`))
      expect(password_hash).not.toContain(ana.password)
    }
    // Same password, different salt: the hashes do not match.
    expect(hashes[0]!.password_hash).not.toBe(hashes[1]!.password_hash)
  })

  it('saves only the hash of the session token', async () => {
    const token = await register()

    const [session] = await queryDatabase(
      (sql) => sql<{ token_hash: string }[]>`
      select token_hash from sessions`,
    )

    expect(session!.token_hash).not.toContain(token)
    expect(session!.token_hash).toBe(await hashSessionToken(token))
  })

  it('saves the email in lowercase and without spaces', async () => {
    const response = await postJson('/auth/register', { ...ana, email: '  Ana@Mail.COM ' })

    expect(await response.json()).toEqual(expectedAccount)
  })

  it('answers 409 when the email already has an account, whatever its capital letters', async () => {
    await register()

    const response = await postJson('/auth/register', { ...ana, email: 'ANA@mail.com' })

    expect(response.status).toBe(409)
    expect(await response.json<ErrorBody>()).toEqual({
      error: 'conflict',
      message: 'An account with this email already exists',
    })
    expect(sessionCookieOf(response)).toBeUndefined()
    // The household of the failed attempt was not left behind.
    expect(await countRows('users')).toBe(1)
    expect(await countRows('households')).toBe(1)
  })

  it('answers 400 with the invalid fields', async () => {
    const response = await postJson('/auth/register', {
      name: ' ',
      email: 'not-an-email',
      password: 'short',
    })

    expect(response.status).toBe(400)
    const body = await response.json<ErrorBody>()
    expect(body.error).toBe('validation_error')
    expect(body.details?.map((issue) => issue.path)).toEqual(['name', 'email', 'password'])
    expect(await countRows('users')).toBe(0)
  })

  it('refuses passwords longer than 128 characters', async () => {
    const response = await postJson('/auth/register', { ...ana, password: 'a'.repeat(129) })

    expect(response.status).toBe(400)
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await register()
  })

  it('signs in with the right password, whatever the capital letters of the email', async () => {
    const response = await postJson('/auth/login', {
      email: 'ANA@mail.com',
      password: ana.password,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(expectedAccount)
    expect((await me(sessionTokenOf(response))).status).toBe(200)
    // One session for registering and another one for this device.
    expect(await countRows('sessions')).toBe(2)
  })

  it('answers 401 with a wrong password', async () => {
    const response = await postJson('/auth/login', {
      email: ana.email,
      password: 'otra clave larga',
    })

    expect(response.status).toBe(401)
    expect(await response.json<ErrorBody>()).toEqual({
      error: 'unauthorized',
      message: 'The email or the password is not correct',
    })
    expect(sessionCookieOf(response)).toBeUndefined()
  })

  it('gives the same answer for an email without account, so emails cannot be guessed', async () => {
    const wrongPassword = await postJson('/auth/login', { email: ana.email, password: 'x' })
    const unknownEmail = await postJson('/auth/login', { email: 'nadie@mail.com', password: 'x' })

    expect(unknownEmail.status).toBe(wrongPassword.status)
    expect(await unknownEmail.json()).toEqual(await wrongPassword.json())
  })

  it('checks the password even when the email has no account, so both take as long', async () => {
    vi.mocked(verifyAgainstDummyHash).mockClear()

    await postJson('/auth/login', { email: 'nadie@mail.com', password: 'x' })

    expect(verifyAgainstDummyHash).toHaveBeenCalledWith('x')
  })

  it('treats SQL in the email and the password as plain text', async () => {
    const attempts = [
      { email: ana.email, password: "' OR '1'='1" },
      { email: "ana'--@mail.com", password: ana.password },
      { email: "x'or'1'='1'@mail.com", password: ana.password },
    ]

    for (const attempt of attempts) {
      const response = await postJson('/auth/login', attempt)
      expect([400, 401]).toContain(response.status)
      expect(sessionCookieOf(response)).toBeUndefined()
    }
    expect(await countRows('users')).toBe(1)
  })

  it('refuses passwords longer than 128 characters before checking them', async () => {
    const response = await postJson('/auth/login', { email: ana.email, password: 'a'.repeat(129) })

    expect(response.status).toBe(400)
  })
})

describe('GET /auth/me', () => {
  it('answers 401 without a session', async () => {
    const response = await request('/auth/me')

    expect(response.status).toBe(401)
    expect(await response.json<ErrorBody>()).toEqual({
      error: 'unauthorized',
      message: 'You need to sign in',
    })
  })

  it('answers 401 with a made-up token and removes the cookie', async () => {
    await register()

    const response = await me('made-up-token')

    expect(response.status).toBe(401)
    expect(sessionCookieOf(response)).toContain('Max-Age=0')
  })

  it('answers 401 and deletes the session once it has expired', async () => {
    const token = await register()
    await setSessionExpiry(token, new Date(Date.now() - 1000))

    const response = await me(token)

    expect(response.status).toBe(401)
    expect(await countRows('sessions')).toBe(0)
  })

  it('extends a session that is close to expiring', async () => {
    const token = await register()
    await setSessionExpiry(token, new Date(Date.now() + DAY_MS))

    const response = await me(token)

    expect(response.status).toBe(200)
    expect(sessionCookieOf(response)).toContain(`${SESSION_COOKIE}=${token}`)
    const expiresAt = await sessionExpiry(token)
    expect(expiresAt!.getTime()).toBeGreaterThan(Date.now() + SESSION_DURATION_MS - DAY_MS)
  })

  it('does not send the cookie again while the session is recent', async () => {
    const token = await register()

    const response = await me(token)

    expect(response.status).toBe(200)
    expect(sessionCookieOf(response)).toBeUndefined()
  })
})

describe('POST /auth/logout', () => {
  it('ends the session and removes the cookie', async () => {
    const token = await register()

    const response = await logout(token)

    expect(response.status).toBe(204)
    expect(sessionCookieOf(response)).toContain('Max-Age=0')
    expect(await countRows('sessions')).toBe(0)
    expect((await me(token)).status).toBe(401)
  })

  it('keeps the other devices signed in', async () => {
    const phone = await register()
    const laptop = sessionTokenOf(await postJson('/auth/login', ana))

    await logout(phone)

    expect((await me(phone)).status).toBe(401)
    expect((await me(laptop)).status).toBe(200)
  })

  it('answers 204 even without a session', async () => {
    const response = await request('/auth/logout', { method: 'POST' })

    expect(response.status).toBe(204)
  })
})
