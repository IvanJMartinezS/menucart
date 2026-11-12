import type { ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

export type ErrorCode =
  'bad_request' | 'validation_error' | 'not_found' | 'conflict' | 'internal_error'

export type ValidationIssue = {
  /** Location of the invalid field, for example `ingredients.0.quantity`. */
  path: string
  message: string
}

/** Shape of every error response of the API. */
export type ErrorBody = {
  error: ErrorCode
  message: string
  details?: ValidationIssue[]
}

const errorCodeByStatus: Record<number, ErrorCode> = {
  400: 'bad_request',
  404: 'not_found',
  409: 'conflict',
}

export const handleError: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    const body: ErrorBody = {
      error: errorCodeByStatus[err.status] ?? 'bad_request',
      message: err.message,
    }
    return c.json(body, err.status)
  }

  console.error(err)
  const body: ErrorBody = { error: 'internal_error', message: 'Something went wrong' }
  return c.json(body, 500)
}

export const handleNotFound: NotFoundHandler = (c) => {
  const body: ErrorBody = { error: 'not_found', message: 'Route not found' }
  return c.json(body, 404)
}
