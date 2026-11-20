import { fromBase64Url, timingSafeEqual, toBase64Url } from './encoding.ts'

const ALGORITHM = 'pbkdf2-sha256'

/** The most that Cloudflare Workers allow for PBKDF2. Saved with each hash, so it can grow later. */
export const PASSWORD_ITERATIONS = 100_000

const SALT_BYTES = 16
const HASH_BYTES = 32

const encoder = new TextEncoder()

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_BYTES * 8,
  )
  return new Uint8Array(bits)
}

/**
 * Hashes a password with PBKDF2-SHA256 and a random salt. The result keeps everything needed
 * to check it later: `pbkdf2-sha256$<iterations>$<salt>$<hash>`.
 */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(password, salt, PASSWORD_ITERATIONS)

  return [ALGORITHM, PASSWORD_ITERATIONS, toBase64Url(salt), toBase64Url(hash)].join('$')
}

/** Tells whether the password matches a hash made by `hashPassword`. */
export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, saltText, hashText, ...rest] = storedHash.split('$')
  const iterations = Number(iterationsText)
  const salt = fromBase64Url(saltText ?? '')
  const expected = fromBase64Url(hashText ?? '')

  if (
    algorithm !== ALGORITHM ||
    rest.length > 0 ||
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    iterations > PASSWORD_ITERATIONS ||
    !salt ||
    !expected ||
    expected.length !== HASH_BYTES
  ) {
    return false
  }

  return timingSafeEqual(await derive(password, salt, iterations), expected)
}

let dummyHash: Promise<string> | undefined

/**
 * Checks the password against a throwaway hash. Used when the email does not exist, so that
 * signing in takes the same time and nobody can find out which emails have an account.
 */
export async function verifyAgainstDummyHash(password: string) {
  // Created on first use: Workers do not allow random values outside a request.
  dummyHash ??= hashPassword(crypto.randomUUID())
  await verifyPassword(password, await dummyHash)
  return false
}
