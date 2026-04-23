import { createMiddleware } from 'hono/factory'
import { and, eq } from 'drizzle-orm'
import { ErrorCodes } from '@duedatehq/contracts/errors'
import { authSchema, createDb, scoped } from '@duedatehq/db'
import type { Env, ContextVars } from '../env'

/**
 * Tenant isolation gate (docs/Dev File/06 §4.1, §4.2).
 *
 * HARD CONTRACT:
 *   - `firmId` MUST come from `session.activeOrganizationId`; NEVER from request input.
 *   - `scoped(db, firmId)` is the sole DB entry point handed to procedures.
 *   - Missing/mismatched firmId fails before RPCHandler reaches a procedure.
 */
export const tenantMiddleware = createMiddleware<{
  Bindings: Pick<Env, 'DB'>
  Variables: ContextVars
}>(async (c, next) => {
  const firmId = c.get('firmId')
  if (!firmId) {
    return c.json({ error: ErrorCodes.TENANT_MISSING }, 401)
  }

  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'UNAUTHORIZED' }, 401)
  }

  const db = createDb(c.env.DB)
  const [membership] = await db
    .select({ status: authSchema.member.status })
    .from(authSchema.member)
    .where(and(eq(authSchema.member.organizationId, firmId), eq(authSchema.member.userId, userId)))
    .limit(1)

  if (!membership) {
    return c.json({ error: ErrorCodes.TENANT_MISMATCH }, 403)
  }

  if (membership.status !== 'active') {
    return c.json({ error: 'FORBIDDEN' }, 403)
  }

  c.set('scoped', scoped(db, firmId))
  return next()
})
