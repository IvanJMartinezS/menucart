# 0001. A pnpm monorepo with a package shared by web and API

- **Status:** Accepted
- **Step:** 1 (project setup) and 9 (first shared schemas)

## Context

The web app and the API describe the same things: a menu and its ingredients, a grocery, a plan, an
account. If each side writes its own rules, they drift apart, and the user sees a form accept data the API
later refuses. The shopping list is also built from the same data in two places: the API returns it, and
the web app may need it without a connection in the future.

## Decision

One repository with pnpm workspaces:

- `apps/web` and `apps/api`, deployed separately.
- `packages/shared`, with the Zod schemas, their inferred types and pure domain logic such as
  `buildShoppingList`. It is imported as TypeScript source (no build step), so a change is seen at once by
  both apps.

Rules that are only about the browser (repeating the password, for example) stay in the web app, and
database details stay in the API.

## Alternatives

- **Two repositories, with the shared code published as a package.** Every change to a rule would need a
  release and two pull requests. Too slow for one developer.
- **Duplicated types and validation.** Simple at first, but nothing warns when both sides disagree.

## Consequences

- A schema changed in `shared` is checked by the typecheck of both apps in the same pull request.
- `shared` cannot depend on the browser, Node.js or the database: only Zod and plain TypeScript.
- One CI workflow checks everything, and `pnpm dev` starts both apps.
