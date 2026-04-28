import type { Env, ContextVars } from '../env'

/**
 * RpcContext — the context shape oRPC handlers receive.
 *
 * Source of truth: apps/server/src/rpc.ts wires {env, vars} into the handler.
 * `tenantMiddleware` (apps/server/src/middleware/tenant.ts) populates
 * `vars.scoped` + `vars.tenantContext` so handlers can rely on them.
 *
 * HARD CONSTRAINT (docs/dev-file/08 §4.1):
 *   - procedures MUST NOT import @duedatehq/db directly.
 *   - they read `context.vars.scoped` to reach D1.
 */
export interface RpcContext {
  env: Env
  request: Request
  vars: ContextVars
}

/**
 * Defensive accessor: scoped repo + active user are guaranteed by middleware,
 * but TypeScript treats them as optional on `ContextVars`. Calling this in a
 * handler narrows the types AND raises a 401-shaped error if middleware was
 * skipped (a wiring bug, not user input).
 */
export function requireTenant(ctx: RpcContext): {
  scoped: NonNullable<ContextVars['scoped']>
  tenant: NonNullable<ContextVars['tenantContext']>
  userId: string
} {
  const { scoped, tenantContext, userId } = ctx.vars
  if (!scoped || !tenantContext || !userId) {
    throw new Error('Tenant middleware did not run before this procedure.')
  }
  return { scoped, tenant: tenantContext, userId }
}

export function requireSession(ctx: RpcContext): {
  firms: NonNullable<ContextVars['firms']>
  session: NonNullable<ContextVars['session']>
  user: NonNullable<ContextVars['user']>
  userId: string
} {
  const { firms, session, user, userId } = ctx.vars
  if (!firms || !session || !user || !userId) {
    throw new Error('Session middleware did not run before this procedure.')
  }
  return { firms, session, user, userId }
}
