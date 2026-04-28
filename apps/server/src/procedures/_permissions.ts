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
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.MEMBER_FORBIDDEN })
  }

  return { members, tenant, userId }
}

export async function requireCurrentFirmOwner(ctx: RpcContext): Promise<CurrentFirmOwnerContext> {
  return requireCurrentFirmRole(ctx, ['owner'])
}
