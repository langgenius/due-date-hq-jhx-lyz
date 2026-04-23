import { Hono } from 'hono'
import type { Env, ContextVars } from '../env'

// /api/health · public liveness probe (no auth, no tenant).
export const healthRoute = new Hono<{ Bindings: Env; Variables: ContextVars }>().get('/', (c) =>
  c.json({ status: 'ok', env: c.env.ENV, requestId: c.get('requestId') }),
)
