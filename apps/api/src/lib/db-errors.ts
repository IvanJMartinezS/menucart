/** Postgres error code for a value that breaks a unique constraint. */
const UNIQUE_VIOLATION = '23505'

type PostgresError = { code?: string; constraint_name?: string }

/**
 * Tells whether a database error was caused by a duplicate value in the given unique constraint.
 * Drizzle wraps the Postgres error, so it is looked for in `cause` too.
 */
export function isUniqueViolation(error: unknown, constraint: string) {
  const candidates = [error, (error as { cause?: unknown } | null)?.cause]

  return candidates.some((candidate) => {
    const postgresError = candidate as PostgresError | null | undefined
    return postgresError?.code === UNIQUE_VIOLATION && postgresError.constraint_name === constraint
  })
}
