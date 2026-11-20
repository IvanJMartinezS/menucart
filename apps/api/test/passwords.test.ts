import { describe, expect, it } from 'vitest'
import { timingSafeEqual } from '../src/lib/encoding.ts'
import {
  hashPassword,
  PASSWORD_ITERATIONS,
  verifyAgainstDummyHash,
  verifyPassword,
} from '../src/lib/passwords.ts'

const password = 'una clave larga'

describe('hashPassword', () => {
  it('keeps the algorithm, the iterations, the salt and the hash', async () => {
    const hash = await hashPassword(password)

    expect(hash).toMatch(
      new RegExp(`^pbkdf2-sha256\\$${PASSWORD_ITERATIONS}\\$[\\w-]{22}\\$[\\w-]{43}$`),
    )
    expect(hash).not.toContain(password)
  })

  it('uses a new salt every time', async () => {
    expect(await hashPassword(password)).not.toBe(await hashPassword(password))
  })
})

describe('verifyPassword', () => {
  it('accepts the right password and refuses any other', async () => {
    const hash = await hashPassword(password)

    expect(await verifyPassword(password, hash)).toBe(true)
    expect(await verifyPassword('una clave larga ', hash)).toBe(false)
    expect(await verifyPassword('Una clave larga', hash)).toBe(false)
    expect(await verifyPassword('', hash)).toBe(false)
  })

  it('refuses hashes it does not understand instead of failing', async () => {
    const [, iterations, salt, hash] = (await hashPassword(password)).split('$')

    const broken = [
      '',
      'plain text',
      `bcrypt$${iterations}$${salt}$${hash}`,
      `pbkdf2-sha256$${PASSWORD_ITERATIONS + 1}$${salt}$${hash}`,
      `pbkdf2-sha256$0$${salt}$${hash}`,
      `pbkdf2-sha256$abc$${salt}$${hash}`,
      `pbkdf2-sha256$${iterations}$not+base64url$${hash}`,
      `pbkdf2-sha256$${iterations}$${salt}$${hash!.slice(0, 20)}`,
      `pbkdf2-sha256$${iterations}$${salt}$${hash}$extra`,
    ]

    for (const storedHash of broken) {
      expect(await verifyPassword(password, storedHash)).toBe(false)
    }
  })
})

describe('verifyAgainstDummyHash', () => {
  it('never accepts a password', async () => {
    expect(await verifyAgainstDummyHash(password)).toBe(false)
  })
})

describe('timingSafeEqual', () => {
  it('compares byte by byte', () => {
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true)
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false)
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false)
  })
})
