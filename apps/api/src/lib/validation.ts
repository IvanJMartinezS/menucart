import { zValidator } from '@hono/zod-validator'
import type { ZodType } from 'zod'
import type { ErrorBody } from './errors.ts'

/** Validates the JSON body with a Zod schema and answers 400 with the uniform error format. */
export const validateJson = <T extends ZodType>(schema: T) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      const body: ErrorBody = {
        error: 'validation_error',
        message: 'The request body is not valid',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }
      return c.json(body, 400)
    }
  })
