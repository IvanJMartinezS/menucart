# Architecture decision records

Short records of the important decisions of MenuCart: the context, what was decided, the alternatives that
were left out and the consequences. They are not changed once accepted. A decision that changes gets a new
record that replaces the old one.

| ADR                                                 | Decision                                                     |
| --------------------------------------------------- | ------------------------------------------------------------ |
| [0001](0001-monorepo-with-a-shared-package.md)      | A pnpm monorepo with a package shared by web and API         |
| [0002](0002-hono-on-workers-with-postgres.md)       | Hono on Cloudflare Workers, Postgres with Drizzle            |
| [0003](0003-typed-api-client.md)                    | The typed client of Hono instead of OpenAPI                  |
| [0004](0004-free-plan-dates-without-overlaps.md)    | Plans with free dates, without overlaps                      |
| [0005](0005-archive-menus-used-in-plans.md)         | Archive menus used in plans instead of deleting them         |
| [0006](0006-cookie-sessions-on-one-origin.md)       | Sessions in a cookie, with the web app and API on one origin |
| [0007](0007-password-hashing-and-attempt-limits.md) | PBKDF2 passwords and limits on failed attempts               |
| [0008](0008-data-per-household.md)                  | Data per household, joined with one-time invitations         |
| [0009](0009-design-direction.md)                    | Design direction: delivery app with an editorial look        |

## Template

```markdown
# NNNN. Title

- **Status:** Proposed | Accepted | Replaced by NNNN
- **Step:** the step of the plan where it was decided

## Context

## Decision

## Alternatives

## Consequences
```
