import { ORPCError } from '@orpc/server'
import { ErrorCodes } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { os } from '../_root'

const load = os.workload.load.handler(async ({ input, context }) => {
  const { scoped, tenant } = requireTenant(context)
  if (tenant.plan === 'solo') {
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.WORKLOAD_PLAN_REQUIRED })
  }

  const repoInput: { asOfDate?: string; windowDays?: number } = {}
  if (input.asOfDate !== undefined) {
    repoInput.asOfDate = input.asOfDate
  }
  if (input.windowDays !== undefined) {
    repoInput.windowDays = input.windowDays
  }

  return scoped.workload.load(repoInput)
})

export const workloadHandlers = { load }
