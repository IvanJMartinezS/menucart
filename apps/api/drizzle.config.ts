import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// In local development, read DATABASE_URL from the same file Wrangler uses.
// Elsewhere (CI, production migrations) it comes from the environment.
if (!process.env.DATABASE_URL && existsSync('.dev.vars')) {
  process.loadEnvFile('.dev.vars')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
