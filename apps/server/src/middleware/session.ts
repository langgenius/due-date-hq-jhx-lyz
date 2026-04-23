import { createMiddleware } from 'hono/factory'
import type { Env, ContextVars } from '../env'

/**
 * Reads the better-auth session from the incoming cookie.
 *
 * Layering (docs/Dev File/06 §4.1):
 *   - 401 if no session
 *   - 403 if session exists but member.status !== 'active'
 *   - Sets c.var.userId (activeOrganizationId handled in tenant middleware)
 *
 * Placeholder: real wiring is added when @duedatehq/auth's createAuth factory is finalized.
 */
export const sessionMiddleware = createMiddleware<{ Bindings: Env; Variables: ContextVars }>(
  async (_c, next) => {
    // TODO(phase-0): read session via `auth.api.getSession({ headers })`.
    await next()
  },
)
