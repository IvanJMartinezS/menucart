import { Hono } from 'hono'
import type { AppEnv } from './env.ts'

const app = new Hono<AppEnv>()

app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
