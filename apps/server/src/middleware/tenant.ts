import { createMiddleware } from 'hono/factory'
import { createDb, scoped } from '@duedatehq/db'
import type { Env, ContextVars } from '../env'

/**
 * Tenant isolation gate (docs/Dev File/06 §4.1, §4.2).
 *
 * HARD CONTRACT:
 *   - `firmId` MUST come from `session.activeOrganizationId`; NEVER from request input.
 *   - `scoped(db, firmId)` is the sole DB entry point handed to procedures.
 *   - Missing/mismatched firmId → ORPCError(TENANT_MISSING).
 */
export const tenantMiddleware = createMiddleware<{ Bindings: Env; Variables: ContextVars }>(
  async (c, next) => {
    const firmId = c.get('firmId')
    if (!firmId) {
      // TODO(phase-0): once session middleware is wired, throw ORPCError('TENANT_MISSING') here.
      await next()
      return
    }
    const db = createDb(c.env.DB)
    c.set('scoped', scoped(db, firmId))
    await next()
  },
)
