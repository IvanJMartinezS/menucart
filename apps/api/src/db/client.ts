import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

/**
 * Creates a database client for a single request.
 *
 * Workers do not keep a long-lived process, so a connection is opened per request
 * and must be closed when the request ends (see `close`).
 */
export function createDb(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 5,
    // Skips an extra round trip to fetch custom types on connect.
    fetch_types: false,
  })

  return {
    db: drizzle(client),
    close: () => client.end(),
  }
}
