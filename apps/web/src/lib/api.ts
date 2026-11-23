import type { AppType } from '@menucart/api'
import { hc } from 'hono/client'
import { apiUrlProblem } from './api-url.ts'

const baseUrl = import.meta.env.VITE_API_URL
const problem = apiUrlProblem(baseUrl)

// Also checked when Vite starts (vite.config.ts); this catches it if it got this far anyway.
if (problem) {
  throw new Error(problem)
}

/**
 * Typed client for the API. Routes, parameters and responses come from the API code itself
 * (`AppType`), so a change in an endpoint that breaks the web app is a compile error.
 * The session travels in a cookie, sent by the browser because the API is on the same origin.
 */
export const api = hc<AppType>(baseUrl)

/** Error for a response of the API that is not successful (4xx or 5xx). */
export class ApiError extends Error {
  readonly status: number
  /** Seconds to wait before trying again, when the API refused too many attempts (429). */
  readonly retryAfter: number | undefined

  constructor(status: number, retryAfter?: number) {
    super(`The API answered with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.retryAfter = retryAfter
  }

  /** Creates the error of a response, keeping its `Retry-After` header when it has one. */
  static from(response: Response) {
    const retryAfter = Number(response.headers.get('Retry-After'))
    return new ApiError(response.status, retryAfter > 0 ? retryAfter : undefined)
  }
}
