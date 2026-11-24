# 0006. Sessions in a cookie, with the web app and API on one origin

- **Status:** Accepted
- **Step:** 28 (accounts and households), 30 (sign-in in the web app)

## Context

Authentication was moved before the deployment: the API must never be on the internet without it. People
sign in with an email and a password and expect to stay signed in on their phone for weeks. Signing out, or
changing the password, must really end sessions.

## Decision

- **Opaque session tokens:** 32 random bytes, sent to the browser once. The database keeps only their
  SHA-256 hash, so reading the `sessions` table does not give working sessions.
- A session lasts **30 days** and is extended when it is used with less than 15 days left.
- The token travels in the **`menucart_session` cookie**: `HttpOnly` (JavaScript cannot read it), `Secure`
  (HTTPS only), `SameSite=Lax` and `Path=/`.
- The web app and the API are served from **one origin**: in development Vite forwards `/api` to the API; in
  production both go under one domain.
- **CSRF:** besides `SameSite`, a middleware refuses writes whose `Origin` is not allowed, or that the browser
  marks as `Sec-Fetch-Site: cross-site`. CORS headers are only sent to the origins in `CORS_ORIGIN`.

## Alternatives

- **JWT in `localStorage`.** Any script injected into the page can steal it, and a JWT cannot be revoked
  before it expires without a table of revoked tokens, which is a session table again.
- **JWT in a cookie.** Solves the theft, not the revocation.
- **An auth service (Auth0, Clerk, Supabase Auth).** Less code, but another vendor and less to show about how
  authentication works.
- **Web and API on different domains.** The cookie would need `SameSite=None` and third-party cookies, which
  browsers are blocking.

## Consequences

- Signing out or changing the password deletes rows, and those sessions stop working at once.
- Every request with a session does one indexed query to find it.
- The deployment must keep web and API on one domain.
- The web app never sees the token: it only knows whether `/auth/me` answers 200 or 401, and any 401 signs
  it out.
