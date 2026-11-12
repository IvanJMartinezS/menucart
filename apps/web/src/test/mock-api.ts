import { vi } from 'vitest'

type MockRequest = {
  method: string
  path: string
  query: URLSearchParams
  body: unknown
}

type Route = {
  method: string
  /** Path with `:params`, for example `/menus/:id`. */
  path: string
  respond: (request: MockRequest) => Response | Promise<Response>
}

const matches = (pattern: string, path: string) =>
  new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`).test(path)

/**
 * Replaces `fetch` with a fake API that answers by method and path.
 * Returns the list of requests received, so tests can check what the web app sent.
 * Unknown routes answer 404, like the real API.
 */
export function mockApi(routes: Route[]) {
  const requests: MockRequest[] = []

  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined
    const request = { method, path: url.pathname, query: url.searchParams, body }
    requests.push(request)

    const route = routes.find((item) => item.method === method && matches(item.path, url.pathname))
    return route
      ? route.respond(request)
      : Response.json({ error: 'not_found', message: 'Route not found' }, { status: 404 })
  })

  return requests
}
