import { ORPCError } from '@orpc/server'
import type { Role } from '@duedatehq/auth/permissions'
import { ErrorCodes } from '@duedatehq/contracts'
import type { ContextVars } from '../env'
import { requireTenant, type RpcContext } from './_context'

export interface CurrentFirmOwnerContext {
  members: NonNullable<ContextVars['members']>
  tenant: NonNullable<ContextVars['tenantContext']>
  userId: string
}

export const CLIENT_WRITE_ROLES = [
  'owner',
  'manager',
  'preparer',
] as const satisfies readonly Role[]
export const MIGRATION_RUN_ROLES = [
  'owner',
  'manager',
  'preparer',
] as const satisfies readonly Role[]
export const MIGRATION_REVERT_ROLES = ['owner', 'manager'] as const satisfies readonly Role[]
export const OBLIGATION_STATUS_WRITE_ROLES = [
  'owner',
  'manager',
  'preparer',
] as const satisfies readonly Role[]

export type Permission =
  | 'audit.export'
  | 'audit.read'
  | 'billing.read'
  | 'billing.update'
  | 'client.write'
  | 'migration.revert'
  | 'migration.run'
  | 'obligation.status.update'
  | 'pulse.apply'
  | 'pulse.read'

const PERMISSION_ROLES: Record<Permission, readonly Role[]> = {
  'audit.export': ['owner'],
  'audit.read': ['owner', 'manager', 'preparer'],
  'billing.read': ['owner', 'manager'],
  'billing.update': ['owner'],
  'client.write': CLIENT_WRITE_ROLES,
  'migration.revert': MIGRATION_REVERT_ROLES,
  'migration.run': MIGRATION_RUN_ROLES,
  'obligation.status.update': OBLIGATION_STATUS_WRITE_ROLES,
  'pulse.apply': ['owner', 'manager'],
  'pulse.read': ['owner', 'manager', 'preparer', 'coordinator'],
}

async function writeDeniedAudit(
  ctx: RpcContext,
  input: {
    action: string
    allowedRoles: readonly Role[]
    actualRole?: Role | null
    reason: string
  },
) {
  try {
    const { scoped, userId } = requireTenant(ctx)
    await scoped.audit.write({
      actorId: userId,
      entityType: 'auth',
      entityId: userId,
      action: 'auth.denied',
      after: {
        attemptedAction: input.action,
        allowedRoles: input.allowedRoles,
        actualRole: input.actualRole ?? null,
      },
      reason: input.reason,
    })
  } catch {
    // Permission checks must fail closed even if audit logging is unavailable.
  }
}

export async function requireCurrentFirmRole(
  ctx: RpcContext,
  allowedRoles: readonly Role[],
): Promise<CurrentFirmOwnerContext> {
  const { tenant, userId } = requireTenant(ctx)
  const { members } = ctx.vars
  if (!members) {
    throw new Error('Member access middleware did not run before this procedure.')
  }

  const actor = await members.findMembership(tenant.firmId, userId)
  if (!actor || actor.status !== 'active' || !allowedRoles.includes(actor.role)) {
    await writeDeniedAudit(ctx, {
      action: 'role.check',
      allowedRoles,
      actualRole: actor?.role ?? null,
      reason: !actor ? 'missing_membership' : actor.status !== 'active' ? actor.status : 'role',
    })
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.MEMBER_FORBIDDEN })
  }

  return { members, tenant, userId }
}

export async function requireCurrentFirmOwner(ctx: RpcContext): Promise<CurrentFirmOwnerContext> {
  return requireCurrentFirmRole(ctx, ['owner'])
}

export async function requirePermission(
  ctx: RpcContext,
  permission: Permission,
): Promise<CurrentFirmOwnerContext> {
  const allowedRoles = PERMISSION_ROLES[permission]
  const { tenant, userId } = requireTenant(ctx)
  const { members } = ctx.vars
  if (!members) {
    throw new Error('Member access middleware did not run before this procedure.')
  }
  const actor = await members.findMembership(tenant.firmId, userId)
  if (!actor || actor.status !== 'active' || !allowedRoles.includes(actor.role)) {
    await writeDeniedAudit(ctx, {
      action: permission,
      allowedRoles,
      actualRole: actor?.role ?? null,
      reason: !actor ? 'missing_membership' : actor.status !== 'active' ? actor.status : 'role',
    })
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.MEMBER_FORBIDDEN })
  }
  return { members, tenant, userId }
}
