import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { TEST_DATABASE_URL } from './database.ts'

/** Runs once before all tests: creates the test database if needed and applies the migrations. */
export default async function setup() {
  const testUrl = new URL(TEST_DATABASE_URL)
  const databaseName = testUrl.pathname.slice(1)

  // Connect to the default `postgres` database to be able to create the test one.
  const adminUrl = new URL(testUrl)
  adminUrl.pathname = '/postgres'
  const admin = postgres(adminUrl.href, { max: 1, onnotice: () => {} })

  try {
    const existing = await admin`select 1 from pg_database where datname = ${databaseName}`
    if (existing.length === 0) {
      await admin.unsafe(`create database "${databaseName}"`)
    }
  } finally {
    await admin.end()
  }

  const client = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} })

  try {
    await migrate(drizzle(client), { migrationsFolder: './drizzle' })
  } finally {
    await client.end()
  }
}
