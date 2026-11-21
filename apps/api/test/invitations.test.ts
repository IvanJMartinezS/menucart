import { beforeEach, describe, expect, it } from 'vitest'
import type { ErrorBody } from '../src/lib/errors.ts'
import { FAILED_ATTEMPTS_WINDOW_MS, MAX_FAILED_ATTEMPTS } from '../src/lib/failed-attempts.ts'
import { hashInvitationCode } from '../src/lib/invitations.ts'
import { SESSION_COOKIE } from '../src/lib/sessions.ts'
import { queryDatabase, request, resetDatabase } from './helpers.ts'

type Account = { id: string; name: string; household: { id: string; name: string } }
type Invitation = { code: string; expiresAt: string }

const ana = { name: 'Ana', email: 'ana@mail.com', password: 'una clave larga' }
const luis = { name: 'Luis', email: 'luis@mail.com', password: 'otra clave larga' }

/** A code with the right shape that was never created. */
const unknownCode = 'K7MQ4-XPN9R'

const invalidCodeError: ErrorBody = {
  error: 'bad_request',
  message: 'The invitation code is not valid. It may have expired or been used already',
}

/** Registers from the given IP, as Cloudflare would tell it. */
const registerFrom = (ip: string, body: object) =>
  request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify(body),
  })

const registerWith = (body: object) => registerFrom('203.0.113.1', body)

/** Registers and returns the account and its session token. */
async function signUp(body: object) {
  const response = await registerWith(body)
  expect(response.status).toBe(201)
  const token = response.headers.getSetCookie()[0]!.split(';')[0]!.split('=')[1]!
  return { account: await response.json<Account>(), token }
}

const withSession = (token: string, init: RequestInit = {}): RequestInit => ({
  ...init,
  headers: { Cookie: `${SESSION_COOKIE}=${token}` },
})

async function invite(token: string) {
  const response = await request('/households/invitations', withSession(token, { method: 'POST' }))
  expect(response.status).toBe(201)
  return response.json<Invitation>()
}

const countRows = (table: 'users' | 'households') =>
  queryDatabase(async (sql) => {
    const [row] = await sql<{ count: number }[]>`select count(*)::int as count from ${sql(table)}`
    return row!.count
  })

beforeEach(resetDatabase)

describe('POST /households/invitations', () => {
  it('answers 401 without a session', async () => {
    const response = await request('/households/invitations', { method: 'POST' })

    expect(response.status).toBe(401)
  })

  it('creates a code that works for 24 hours', async () => {
    const { token } = await signUp(ana)

    const { code, expiresAt } = await invite(token)

    expect(code).toMatch(/^[2-9A-HJKMNP-Z]{5}-[2-9A-HJKMNP-Z]{5}$/)
    const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000
    expect(Math.abs(new Date(expiresAt).getTime() - expectedExpiry)).toBeLessThan(60_000)
  })

  it('saves only the hash of the code', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)

    const [row] = await queryDatabase(
      (sql) => sql<{ code_hash: string }[]>`
      select code_hash from household_invitations`,
    )

    expect(row!.code_hash).toBe(await hashInvitationCode(code.replace('-', '')))
  })

  it('creates a different code each time', async () => {
    const { token } = await signUp(ana)

    const codes = new Set<string>()
    for (let attempt = 0; attempt < 5; attempt++) {
      codes.add((await invite(token)).code)
    }

    expect(codes.size).toBe(5)
  })
})

describe('Joining a household when registering', () => {
  it('joins the household of the code instead of creating one', async () => {
    const { account: anaAccount, token } = await signUp(ana)
    const { code } = await invite(token)

    const { account: luisAccount } = await signUp({ ...luis, invitationCode: code })

    expect(luisAccount.household).toEqual(anaAccount.household)
    expect(await countRows('households')).toBe(1)

    const household = await request('/households/current', withSession(token))
    expect(await household.json()).toEqual({
      id: anaAccount.household.id,
      name: 'Ana',
      members: [
        { id: anaAccount.id, name: 'Ana' },
        { id: luisAccount.id, name: 'Luis' },
      ],
    })
  })

  it('accepts the code in lowercase, with spaces and without the dash', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)

    const response = await registerWith({
      ...luis,
      invitationCode: ` ${code.replace('-', ' ').toLowerCase()} `,
    })

    expect(response.status).toBe(201)
  })

  it('records who used the code', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)
    const { account } = await signUp({ ...luis, invitationCode: code })

    const [row] = await queryDatabase(
      (sql) => sql<{ used_by: string; used_at: Date }[]>`
      select used_by, used_at from household_invitations`,
    )

    expect(row!.used_by).toBe(account.id)
    expect(row!.used_at).toBeInstanceOf(Date)
  })

  it('refuses a code that was already used', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)
    await signUp({ ...luis, invitationCode: code })

    const response = await registerWith({ ...luis, email: 'eva@mail.com', invitationCode: code })

    expect(response.status).toBe(400)
    expect(await response.json<ErrorBody>()).toEqual(invalidCodeError)
    expect(await countRows('users')).toBe(2)
  })

  it('refuses a code that has expired', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)
    await queryDatabase(
      (sql) => sql`
      update household_invitations set expires_at = now() - interval '1 second'`,
    )

    const response = await registerWith({ ...luis, invitationCode: code })

    expect(response.status).toBe(400)
  })

  it('refuses a code replaced by a newer one', async () => {
    const { token } = await signUp(ana)
    const { code: oldCode } = await invite(token)
    const { code: newCode } = await invite(token)

    expect((await registerWith({ ...luis, invitationCode: oldCode })).status).toBe(400)
    expect((await registerWith({ ...luis, invitationCode: newCode })).status).toBe(201)
  })

  it('creates nothing when the code does not exist', async () => {
    await signUp(ana)

    const response = await registerWith({ ...luis, invitationCode: unknownCode })

    expect(response.status).toBe(400)
    expect(await response.json<ErrorBody>()).toEqual(invalidCodeError)
    expect(response.headers.getSetCookie()).toEqual([])
    expect(await countRows('users')).toBe(1)
    expect(await countRows('households')).toBe(1)
  })

  it('answers 400 with the field when the code has the wrong shape', async () => {
    const response = await registerWith({
      ...luis,
      invitationCode: "K7MQ4-XPN9'; drop table users",
    })

    expect(response.status).toBe(400)
    const body = await response.json<ErrorBody>()
    expect(body.error).toBe('validation_error')
    expect(new Set(body.details?.map((issue) => issue.path))).toEqual(new Set(['invitationCode']))
  })

  it('keeps the code usable when registering fails for another reason', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)

    const duplicate = await registerWith({ ...luis, email: ana.email, invitationCode: code })
    expect(duplicate.status).toBe(409)

    expect((await registerWith({ ...luis, invitationCode: code })).status).toBe(201)
  })

  it('lets only one person join when two use the same code at the same time', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)

    const responses = await Promise.all([
      registerWith({ ...luis, invitationCode: code }),
      registerWith({ ...luis, email: 'eva@mail.com', invitationCode: code }),
    ])

    expect(responses.map((response) => response.status).sort()).toEqual([201, 400])
    expect(await countRows('users')).toBe(2)
  })
})

describe('GET /households/current', () => {
  it('answers 401 without a session', async () => {
    expect((await request('/households/current')).status).toBe(401)
  })

  it('shows only the people of the household, never those of other households', async () => {
    const { account, token } = await signUp(ana)
    await signUp(luis)

    const response = await request('/households/current', withSession(token))

    expect(await response.json()).toEqual({
      id: account.household.id,
      name: 'Ana',
      members: [{ id: account.id, name: 'Ana' }],
    })
  })
})

describe('Limit of failed invitation attempts', () => {
  const attacker = '198.51.100.7'

  async function failTimes(ip: string, times: number) {
    for (let attempt = 0; attempt < times; attempt++) {
      const response = await registerFrom(ip, { ...luis, invitationCode: unknownCode })
      expect(response.status).toBe(400)
    }
  }

  it(`refuses more attempts after ${MAX_FAILED_ATTEMPTS} failures, even with a valid code`, async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)
    await failTimes(attacker, MAX_FAILED_ATTEMPTS)

    const response = await registerFrom(attacker, { ...luis, invitationCode: code })

    expect(response.status).toBe(429)
    expect(await response.json<ErrorBody>()).toEqual({
      error: 'too_many_requests',
      message: 'Too many failed attempts. Try again later',
    })
    const retryAfter = Number(response.headers.get('Retry-After'))
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(FAILED_ATTEMPTS_WINDOW_MS / 1000)
    expect(await countRows('users')).toBe(1)
  })

  it('allows the attempts left before the limit', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)
    await failTimes(attacker, MAX_FAILED_ATTEMPTS - 1)

    expect((await registerFrom(attacker, { ...luis, invitationCode: code })).status).toBe(201)
  })

  it('does not limit other people', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)
    await failTimes(attacker, MAX_FAILED_ATTEMPTS)

    expect((await registerFrom('192.0.2.50', { ...luis, invitationCode: code })).status).toBe(201)
  })

  it('does not limit registering without a code', async () => {
    await failTimes(attacker, MAX_FAILED_ATTEMPTS)

    expect((await registerFrom(attacker, luis)).status).toBe(201)
  })

  it('forgets failures older than the window', async () => {
    const { token } = await signUp(ana)
    const { code } = await invite(token)
    await failTimes(attacker, MAX_FAILED_ATTEMPTS)
    await queryDatabase(
      (sql) => sql`
      update failed_attempts set created_at = now() - interval '16 minutes'`,
    )

    expect((await registerFrom(attacker, { ...luis, invitationCode: code })).status).toBe(201)
  })
})
