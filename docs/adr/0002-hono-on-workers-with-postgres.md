# 0002. Hono on Cloudflare Workers, Postgres with Drizzle

- **Status:** Accepted
- **Step:** 1 (project setup), 7 (database connection) and 8 (first migration)

## Context

MenuCart is a small app for one household, used a few times a week. It must cost nothing while it is small,
need no server to maintain, and still be built the way a production API is built. Its data is clearly
relational: menus have ingredients, plans choose menus and groceries, everything belongs to a household.

## Decision

- **API:** [Hono](https://hono.dev) on **Cloudflare Workers**. Hono is small, built on web standards
  (`Request`, `Response`, Web Crypto) and its routes have types the web app can use
  ([ADR 0003](0003-typed-api-client.md)). Workers run without a server and have a free tier.
- **Database:** **PostgreSQL**, with Postgres 18 in Docker for development and a managed Postgres in
  production.
- **Data access:** **Drizzle ORM** with the `postgres` driver. The schema is TypeScript, queries are typed and
  close to SQL, and every change is a versioned SQL migration committed with the code.

## Alternatives

- **Node.js with Express or Fastify on a server.** Familiar, but it needs a machine to run and maintain.
- **Cloudflare D1 (SQLite).** Native to Workers, but it lacks what the domain needs: exclusion constraints
  for plans ([ADR 0004](0004-free-plan-dates-without-overlaps.md)), `unaccent` for searching ingredients,
  and `numeric` quantities.
- **Prisma.** More abstraction and a heavier runtime on Workers. Drizzle keeps the SQL visible.

## Consequences

- Workers keep no process between requests: the API opens one database connection per request and closes
  it after the response. In production a connection pooler is needed in front of Postgres; it is decided
  when deploying.
- Some rules cannot be written with the schema builder (exclusion constraints, filling a new column before
  making it `NOT NULL`), so those migrations are edited by hand and explained with comments.
- API tests run against a real Postgres, locally in Docker and in CI as a service, never against a mock.
