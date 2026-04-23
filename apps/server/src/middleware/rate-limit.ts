import { createMiddleware } from 'hono/factory'
import type { Env, ContextVars } from '../env'

// Rate Limit binding (docs/Dev File/01 §1). KV-backed counter as a fallback lands with the
// degradation matrix (docs/Dev File/01 §5).
export const rateLimitMiddleware = createMiddleware<{ Bindings: Env; Variables: ContextVars }>(
  async (c, next) => {
    const key = c.get('userId') ?? c.req.header('cf-connecting-ip') ?? 'anon'
    const { success } = await c.env.RATE_LIMIT.limit({ key })
    if (!success) {
      return c.json({ error: 'RATE_LIMITED' }, 429)
    }
    await next()
  },
)
