import type { AppType } from '@menucart/api'
import { hc } from 'hono/client'

const baseUrl = import.meta.env.VITE_API_URL

if (!baseUrl) {
  throw new Error('VITE_API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.')
}

/**
 * Typed client for the API. Routes, parameters and responses come from the API code itself
 * (`AppType`), so a change in an endpoint that breaks the web app is a compile error.
 */
export const api = hc<AppType>(baseUrl)

/** Error for a response of the API that is not successful (4xx or 5xx). */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`The API answered with status ${status}`)
    this.name = 'ApiError'
    this.status = status
  }
}
