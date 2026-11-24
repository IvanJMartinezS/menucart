# 0007. PBKDF2 passwords and limits on failed attempts

- **Status:** Accepted
- **Step:** 28 (accounts), 29 (attempt limits) and 32 (changing the password)

## Context

Passwords must be stored so that a copy of the database does not reveal them, using only what Cloudflare
Workers offer: Web Crypto, without native modules and with little CPU time per request. Anything that can be
guessed by trying many times (passwords, invitation codes) must be slowed down.

## Decision

**Passwords**

- **PBKDF2-SHA256** from Web Crypto, with a 16-byte random salt and **100,000 iterations** (the most Workers
  allow). The stored value keeps everything needed to check it: `pbkdf2-sha256$<iterations>$<salt>$<hash>`,
  so the iterations can be raised later without breaking old hashes.
- Hashes are compared in constant time. Signing in with an unknown email still checks a dummy hash, so the
  response time does not tell whether an account exists.
- Rules: 10 to 128 characters. The maximum protects the server, because hashing is slow on purpose.
- Changing the password asks for the current one, ends every session and starts a new one on this device,
  in one transaction.

**Failed attempts**

- A `failed_attempts` table counts failures per action and client. **5 failures in 15 minutes** block the
  action with **429** and a `Retry-After` header.
- The client is the IP address (`CF-Connecting-IP`, which Cloudflare sets and clients cannot fake) for
  signing in and invitation codes, and the **account** for changing the password.
- Every time calculation uses the clock of Postgres (`now()`), which also dates the attempts.

## Alternatives

- **Argon2id or bcrypt.** Better against GPU attacks, but they need WebAssembly or native code on Workers and
  more CPU time than the free plan gives. PBKDF2 with a stored algorithm name allows a later migration.
- **Cloudflare Rate Limiting or Durable Objects.** They depend on the platform and are harder to test. The
  table works the same locally, in CI and in production, and is tested with the rest of the API.

## Consequences

- A stolen database gives salted, slow hashes, not passwords.
- An attacker can try 5 passwords every 15 minutes per IP address.
- The table stays small: old attempts are deleted when a new one is recorded.
- A general limit on requests (not only failures) is still needed, and is planned for the deployment.
