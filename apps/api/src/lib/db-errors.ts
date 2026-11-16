type PostgresError = { code?: string; constraint_name?: string }

/**
 * Tells whether a database error was caused by the given constraint: a unique index
 * (duplicate value), an exclusion constraint (overlapping plans) or a foreign key
 * (a row still in use). Drizzle wraps the Postgres error, so it is looked for in `cause` too.
 */
export function isConstraintViolation(error: unknown, constraint: string) {
  const candidates = [error, (error as { cause?: unknown } | null)?.cause]

  return candidates.some(
    (candidate) => (candidate as PostgresError | null | undefined)?.constraint_name === constraint,
  )
}
