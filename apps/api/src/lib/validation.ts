import { zValidator } from '@hono/zod-validator'
import type { Context } from 'hono'
import type { ZodType } from 'zod'
import type { ErrorBody } from './errors.ts'

type Issue = { path: PropertyKey[]; message: string }

/** Answers 400 with the uniform error format, listing every invalid field. */
const validationError = (c: Context, message: string, issues: Issue[]) => {
  const body: ErrorBody = {
    error: 'validation_error',
    message,
    details: issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  }
  return c.json(body, 400)
}

/** Validates the JSON body with a Zod schema. */
export const validateJson = <T extends ZodType>(schema: T) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return validationError(c, 'The request body is not valid', result.error.issues)
    }
  })

/** Validates the URL parameters (for example `:id`) with a Zod schema. */
export const validateParams = <T extends ZodType>(schema: T) =>
  zValidator('param', schema, (result, c) => {
    if (!result.success) {
      return validationError(c, 'The URL parameters are not valid', result.error.issues)
    }
  })
