import postgres from 'postgres'
import app from '../src/index.ts'
import { TEST_DATABASE_URL } from './database.ts'

const env = { DATABASE_URL: TEST_DATABASE_URL }

/** Minimal stand-in for the Workers execution context, which does not exist outside Cloudflare. */
const executionCtx = {
  waitUntil: (promise: Promise<unknown>) => void promise,
  passThroughOnException: () => {},
  props: {},
} as ExecutionContext

/** Sends a request to the API in memory, without starting a server. */
export const request = (path: string, init?: RequestInit) =>
  app.request(path, init, env, executionCtx)

const sendJson = (method: 'POST' | 'PUT', path: string, body: unknown) =>
  request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const postJson = (path: string, body: unknown) => sendJson('POST', path, body)

export const putJson = (path: string, body: unknown) => sendJson('PUT', path, body)

/** Empties every table so each test starts from a clean database. */
export async function resetDatabase() {
  const sql = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} })

  try {
    await sql`truncate table menus cascade`
  } finally {
    await sql.end()
  }
}
