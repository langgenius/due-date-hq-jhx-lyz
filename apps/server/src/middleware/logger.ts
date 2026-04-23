import { createMiddleware } from 'hono/factory'
import type { Env, ContextVars } from '../env'

// Attach a request id + structured access log. Real Sentry/Logpush wiring lands in Phase 0.
export const requestIdMiddleware = createMiddleware<{ Bindings: Env; Variables: ContextVars }>(
  async (c, next) => {
    const requestId = crypto.randomUUID()
    c.set('requestId', requestId)
    c.header('x-request-id', requestId)
    await next()
  },
)
