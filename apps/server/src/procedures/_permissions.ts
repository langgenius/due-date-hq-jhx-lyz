import { ORPCError } from '@orpc/server'
import { ErrorCodes } from '@duedatehq/contracts'
import type { ContextVars } from '../env'
import { requireTenant, type RpcContext } from './_context'

export interface CurrentFirmOwnerContext {
  members: NonNullable<ContextVars['members']>
  tenant: NonNullable<ContextVars['tenantContext']>
  userId: string
}

export async function requireCurrentFirmOwner(ctx: RpcContext): Promise<CurrentFirmOwnerContext> {
  const { tenant, userId } = requireTenant(ctx)
  const { members } = ctx.vars
  if (!members) {
    throw new Error('Member access middleware did not run before this procedure.')
  }

  const actor = await members.findMembership(tenant.firmId, userId)
  if (!actor || actor.status !== 'active' || actor.role !== 'owner') {
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.MEMBER_FORBIDDEN })
  }

  return { members, tenant, userId }
}
