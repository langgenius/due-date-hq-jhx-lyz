import { createMiddleware } from 'hono/factory'
import { createWorkerAuth } from '../auth'
import type { Env, ContextVars } from '../env'

/**
 * Reads the better-auth session from the incoming cookie.
 *
 * Layering (docs/Dev File/06 §4.1):
 *   - 401 if no session
 *   - Sets c.var.userId and c.var.firmId from activeOrganizationId
 *
 */
export const sessionMiddleware = createMiddleware<{ Bindings: Env; Variables: ContextVars }>(
  async (c, next) => {
    let executionCtx: ExecutionContext | undefined
    try {
      executionCtx = c.executionCtx
    } catch {
      executionCtx = undefined
    }

    const auth = createWorkerAuth(c.env, executionCtx)
    const sessionData = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!sessionData?.session || !sessionData.user) {
      return c.json({ error: 'UNAUTHORIZED' }, 401)
    }

    c.set('session', sessionData.session)
    c.set('user', sessionData.user)
    c.set('userId', sessionData.user.id)

    if (sessionData.session.activeOrganizationId) {
      c.set('firmId', sessionData.session.activeOrganizationId)
    }

    return next()
  },
)
