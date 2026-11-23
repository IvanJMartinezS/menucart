import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrorBody } from '../src/lib/errors.ts'
import { MAX_FAILED_ATTEMPTS } from '../src/lib/failed-attempts.ts'
import { SESSION_COOKIE } from '../src/lib/sessions.ts'
import { postJson, putJson, queryDatabase, request, resetDatabase } from './helpers.ts'

const ana = { name: 'Ana', email: 'ana@mail.com', password: 'una clave larga' }
const newPassword = 'otra clave nueva'

const sessionTokenOf = (response: Response) => {
  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`))
  return cookie?.split(';')[0]?.split('=')[1]
}

const asSession = (token: string, ip = '203.0.113.1'): RequestInit => ({
  headers: { Cookie: `${SESSION_COOKIE}=${token}`, 'CF-Connecting-IP': ip },
})

const changePassword = (token: string, body: object, ip?: string) =>
  putJson('/auth/password', body, asSession(token, ip))

const me = (token: string) => request('/auth/me', asSession(token))

const login = (password: string) => postJson('/auth/login', { email: ana.email, password })

let phone: string

beforeEach(async () => {
  await resetDatabase()
  phone = sessionTokenOf(await postJson('/auth/register', ana))!
})

describe('PUT /auth/password', () => {
  it('answers 401 without a session', async () => {
    const response = await putJson('/auth/password', {
      currentPassword: ana.password,
      newPassword,
    })

    expect(response.status).toBe(401)
  })

  it('changes the password: the old one stops working and the new one works', async () => {
    const response = await changePassword(phone, { currentPassword: ana.password, newPassword })

    expect(response.status).toBe(204)
    expect((await login(ana.password)).status).toBe(401)
    expect((await login(newPassword)).status).toBe(200)
  })

  it('saves a new salted hash, never the password itself', async () => {
    const [before] = await queryDatabase(
      (sql) => sql<{ password_hash: string }[]>`
      select password_hash from users`,
    )

    await changePassword(phone, { currentPassword: ana.password, newPassword })

    const [after] = await queryDatabase(
      (sql) => sql<{ password_hash: string }[]>`
      select password_hash from users`,
    )
    expect(after!.password_hash).toMatch(/^pbkdf2-sha256\$/)
    expect(after!.password_hash).not.toBe(before!.password_hash)
    expect(after!.password_hash).not.toContain(newPassword)
  })

  it('signs out the other devices and gives this one a new session', async () => {
    const laptop = sessionTokenOf(await login(ana.password))!

    const response = await changePassword(phone, { currentPassword: ana.password, newPassword })
    const renewed = sessionTokenOf(response)

    expect(renewed).toBeTruthy()
    expect(renewed).not.toBe(phone)
    expect((await me(renewed!)).status).toBe(200)
    expect((await me(phone)).status).toBe(401)
    expect((await me(laptop)).status).toBe(401)
  })

  it('answers 400, not 401, when the current password is wrong, and changes nothing', async () => {
    const response = await changePassword(phone, {
      currentPassword: 'no es la clave',
      newPassword,
    })

    expect(response.status).toBe(400)
    expect(await response.json<ErrorBody>()).toEqual({
      error: 'bad_request',
      message: 'The current password is not correct',
    })
    // The session goes on: a typo must not sign the user out.
    expect((await me(phone)).status).toBe(200)
    expect((await login(ana.password)).status).toBe(200)
  })

  it('refuses a new password equal to the current one', async () => {
    const response = await changePassword(phone, {
      currentPassword: ana.password,
      newPassword: ana.password,
    })

    expect(response.status).toBe(400)
    const body = await response.json<ErrorBody>()
    expect(body.error).toBe('validation_error')
    expect(body.details?.map((issue) => issue.path)).toEqual(['newPassword'])
  })

  it('refuses a new password shorter than 10 characters', async () => {
    const response = await changePassword(phone, {
      currentPassword: ana.password,
      newPassword: 'corta',
    })

    expect(response.status).toBe(400)
    expect((await login(ana.password)).status).toBe(200)
  })
})

describe('Limit of failed password changes', () => {
  const failTimes = async (times: number) => {
    for (let attempt = 0; attempt < times; attempt++) {
      // A different IP each time: the limit belongs to the account.
      const wrong = { currentPassword: 'no es la clave', newPassword }
      const response = await changePassword(phone, wrong, `198.51.100.${attempt}`)
      expect(response.status).toBe(400)
    }
  }

  it(`refuses more attempts after ${MAX_FAILED_ATTEMPTS} failures, from any IP, even the right password`, async () => {
    await failTimes(MAX_FAILED_ATTEMPTS)

    const response = await changePassword(
      phone,
      { currentPassword: ana.password, newPassword },
      '192.0.2.99',
    )

    expect(response.status).toBe(429)
    expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0)
    expect((await login(ana.password)).status).toBe(200)
  })

  it('allows the attempts left before the limit', async () => {
    await failTimes(MAX_FAILED_ATTEMPTS - 1)

    const response = await changePassword(phone, { currentPassword: ana.password, newPassword })

    expect(response.status).toBe(204)
  })

  it('does not limit other accounts', async () => {
    await failTimes(MAX_FAILED_ATTEMPTS)
    const luis = sessionTokenOf(
      await postJson('/auth/register', { ...ana, name: 'Luis', email: 'luis@mail.com' }),
    )!

    const response = await changePassword(luis, { currentPassword: ana.password, newPassword })

    expect(response.status).toBe(204)
  })

  it('does not limit signing in', async () => {
    await failTimes(MAX_FAILED_ATTEMPTS)

    expect((await login(ana.password)).status).toBe(200)
  })
})
