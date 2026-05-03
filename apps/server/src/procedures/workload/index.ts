import { ORPCError } from '@orpc/server'
import { ErrorCodes, type WorkloadLoadOutput } from '@duedatehq/contracts'
import { planHasFeature } from '@duedatehq/core/plan-entitlements'
import { requireTenant } from '../_context'
import { os } from '../_root'

const load = os.workload.load.handler(async ({ input, context }) => {
  const { scoped, tenant } = requireTenant(context)
  if (!planHasFeature(tenant.plan, 'sharedDeadlineOperations')) {
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.WORKLOAD_PLAN_REQUIRED })
  }

  const repoInput: { asOfDate?: string; windowDays?: number } = {}
  if (input.asOfDate !== undefined) {
    repoInput.asOfDate = input.asOfDate
  }
  if (input.windowDays !== undefined) {
    repoInput.windowDays = input.windowDays
  }

  const result = await scoped.workload.load(repoInput)
  const managerInsights = planHasFeature(tenant.plan, 'teamManagerOperations')
    ? buildManagerInsights(result)
    : null
  return { ...result, managerInsights } satisfies WorkloadLoadOutput
})

export const workloadHandlers = { load }

function buildManagerInsights(
  result: Omit<WorkloadLoadOutput, 'managerInsights'>,
): WorkloadLoadOutput['managerInsights'] {
  const capacityRow =
    result.rows
      .filter((row) => row.kind === 'assignee')
      .toSorted((a, b) => b.loadScore - a.loadScore || b.open - a.open)[0] ?? null

  return {
    capacityOwnerLabel: capacityRow?.ownerLabel ?? null,
    capacityLoadScore: capacityRow?.loadScore ?? 0,
    capacityOpen: capacityRow?.open ?? 0,
    unassignedOpen: result.summary.unassigned,
    waitingOpen: result.summary.waiting,
    reviewOpen: result.summary.review,
  }
}
