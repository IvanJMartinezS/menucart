# 0003. The typed client of Hono instead of OpenAPI

- **Status:** Accepted
- **Step:** 15 (connecting the web app to the API)

## Context

The web app calls about thirty endpoints. With hand-written `fetch` calls, renaming a field or changing a
route in the API only fails when someone uses that screen. The project has one consumer, the web app, which
lives in the same repository.

## Decision

The API chains all its routes into one Hono app and exports its type, `AppType`. The web app imports that
**type only** (the API is a dev dependency of the web app) and calls the API with `hc<AppType>(baseUrl)` from
`hono/client`:

```ts
const response = await api.menus[':id'].$get({ param: { id } })
```

Paths, parameters, bodies and responses come from the API code. Errors are turned into an `ApiError` with the
status (and `Retry-After` when there is one), so each screen decides what to tell the user.

## Alternatives

- **OpenAPI with a generated client.** Good for public APIs with many consumers, but it adds a spec to keep
  in sync and a generation step, for a single consumer in the same repository.
- **tRPC.** Typed too, but it replaces REST: the API would no longer be a plain HTTP API that `curl`, other
  clients or a future mobile app could use.
- **Hand-written `fetch` with shared types.** Types of the bodies are shared, but routes and responses are
  not checked.

## Consequences

- A change in the API that breaks the web app is a compile error in the same pull request.
- Routes must be chained (`new Hono().get(…).post(…)`) for their types to be kept.
- Status codes the validators add (400) or the middlewares add (401, 403) are not all part of the types:
  the web app reads them as a plain `number`.
- The API stays a normal REST API. Documenting it for other consumers (OpenAPI) can be added later from the
  same Zod schemas.
