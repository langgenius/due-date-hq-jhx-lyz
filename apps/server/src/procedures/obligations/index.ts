import { ORPCError } from '@orpc/server'
import type { ObligationInstancePublic } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import {
  MIGRATION_RUN_ROLES,
  OBLIGATION_STATUS_WRITE_ROLES,
  requireCurrentFirmRole,
} from '../_permissions'
import { os } from '../_root'
import { enqueueDashboardBriefRefresh } from '../../jobs/dashboard-brief/enqueue'
import { recalculateObligationExposure } from '../_penalty-exposure'
import {
  bulkUpdateObligationReadiness,
  bulkUpdateObligationStatus,
  decideObligationExtension,
  toObligationPublic,
  updateObligationReadiness,
  updateObligationStatus,
} from './_service'

/**
 * obligations.* — Demo Sprint subset of the Obligation Domain Contract.
 *
 * Authority:
 *   - packages/contracts/src/obligations.ts (frozen contract)
 *   - docs/dev-file/06 §4.1 (procedures call scoped repo only)
 *
 * Scope (Day 3): unblock Migration Step 4 commit. We expose createBatch,
 * listByClient, and updateStatus (LYZ workboard). `updateDueDate` belongs
 * to the pulse-apply path (Day 5+) and stays a stub.
 */

interface ObligationRow {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: ObligationInstancePublic['status']
  readiness: ObligationInstancePublic['readiness']
  extensionDecision: ObligationInstancePublic['extensionDecision']
  extensionMemo: string | null
  extensionSource: string | null
  extensionExpectedDueDate: Date | null
  extensionDecidedAt: Date | null
  extensionDecidedByUserId: string | null
  migrationBatchId: string | null
  estimatedTaxDueCents: number | null
  estimatedExposureCents: number | null
  exposureStatus: ObligationInstancePublic['exposureStatus']
  penaltyBreakdownJson: unknown
  penaltyFormulaVersion: string | null
  exposureCalculatedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const createBatch = os.obligations.createBatch.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, MIGRATION_RUN_ROLES)
  const { scoped, userId } = requireTenant(context)

  const repoInputs = input.obligations.map((o) => {
    const repoInput: {
      clientId: string
      taxType: string
      taxYear: number | null
      baseDueDate: Date
      currentDueDate: Date
      status?: ObligationInstancePublic['status']
      readiness?: ObligationInstancePublic['readiness']
      migrationBatchId: string | null
      estimatedTaxDueCents?: number | null
      estimatedExposureCents?: number | null
      exposureStatus?: ObligationInstancePublic['exposureStatus']
      penaltyBreakdownJson?: unknown
      penaltyFormulaVersion?: string | null
      exposureCalculatedAt?: Date | null
    } = {
      clientId: o.clientId,
      taxType: o.taxType,
      taxYear: o.taxYear ?? null,
      baseDueDate: new Date(o.baseDueDate),
      currentDueDate: o.currentDueDate ? new Date(o.currentDueDate) : new Date(o.baseDueDate),
      migrationBatchId: o.migrationBatchId ?? null,
      estimatedTaxDueCents: o.estimatedTaxDueCents ?? null,
      estimatedExposureCents: o.estimatedExposureCents ?? null,
      exposureStatus: o.exposureStatus ?? 'needs_input',
      penaltyBreakdownJson: o.penaltyBreakdown ?? [],
      penaltyFormulaVersion: o.penaltyFormulaVersion ?? null,
      exposureCalculatedAt: o.exposureCalculatedAt ? new Date(o.exposureCalculatedAt) : null,
    }
    if (o.status !== undefined) repoInput.status = o.status
    if (o.readiness !== undefined) repoInput.readiness = o.readiness
    return repoInput
  })

  const { ids } = await scoped.obligations.createBatch(repoInputs)

  await scoped.audit.write({
    actorId: userId,
    entityType: 'obligation_batch',
    entityId: ids[0] ?? 'empty',
    action: 'obligation.batch_created',
    after: { count: ids.length },
  })

  // Re-read so the response carries DB-persisted timestamps + canonical
  // status. Per-client readback is cheap because Step 4 commit always
  // groups input by client; fan out per unique clientId in parallel.
  const uniqueClients = Array.from(new Set(input.obligations.map((o) => o.clientId)))
  const idSet = new Set(ids)
  const rowSets = await Promise.all(
    uniqueClients.map((cid) => scoped.obligations.listByClient(cid)),
  )
  const allRows: ObligationRow[] = rowSets.flat().filter((row) => idSet.has(row.id))

  if (allRows.length !== ids.length) {
    // Defensive: re-read drift would mask a partial batch failure.
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Created obligations could not be re-read in full.',
    })
  }

  return { obligations: allRows.map(toObligationPublic) }
})

const listByClient = os.obligations.listByClient.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const rows = await scoped.obligations.listByClient(input.clientId)
  return rows.map(toObligationPublic)
})

const updateDueDate = os.obligations.updateDueDate.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, tenant, userId } = requireTenant(context)
  const before = await scoped.obligations.findById(input.id)
  if (!before) {
    throw new ORPCError('NOT_FOUND', {
      message: `Obligation ${input.id} not found in current firm.`,
    })
  }

  await scoped.obligations.updateDueDate(
    input.id,
    new Date(`${input.currentDueDate}T00:00:00.000Z`),
  )
  await recalculateObligationExposure(scoped, input.id)
  const after = await scoped.obligations.findById(input.id)
  if (!after) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Updated obligation could not be re-read.',
    })
  }

  await scoped.audit.write({
    actorId: userId,
    entityType: 'obligation_instance',
    entityId: input.id,
    action: 'obligation.due_date.updated',
    before: { currentDueDate: before.currentDueDate.toISOString().slice(0, 10) },
    after: { currentDueDate: input.currentDueDate },
  })

  await enqueueDashboardBriefRefresh(context.env, {
    firmId: tenant.firmId,
    reason: 'due_date_update',
  }).catch(() => false)

  return toObligationPublic(after)
})

const updateStatus = os.obligations.updateStatus.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, tenant, userId } = requireTenant(context)
  const result = await updateObligationStatus(scoped, userId, input)
  await enqueueDashboardBriefRefresh(context.env, {
    firmId: tenant.firmId,
    reason: 'status_change',
  }).catch(() => false)
  return result
})

const bulkUpdateStatus = os.obligations.bulkUpdateStatus.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, tenant, userId } = requireTenant(context)
  const result = await bulkUpdateObligationStatus(scoped, userId, input)
  if (result.updatedCount > 0) {
    await enqueueDashboardBriefRefresh(context.env, {
      firmId: tenant.firmId,
      reason: 'status_change',
    }).catch(() => false)
  }
  return result
})

const updateReadiness = os.obligations.updateReadiness.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, tenant, userId } = requireTenant(context)
  const result = await updateObligationReadiness(scoped, userId, input)
  await enqueueDashboardBriefRefresh(context.env, {
    firmId: tenant.firmId,
    reason: 'readiness_change',
  }).catch(() => false)
  return result
})

const decideExtension = os.obligations.decideExtension.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, tenant, userId } = requireTenant(context)
  const result = await decideObligationExtension(scoped, userId, input)
  await enqueueDashboardBriefRefresh(context.env, {
    firmId: tenant.firmId,
    reason: 'status_change',
  }).catch(() => false)
  return result
})

const bulkUpdateReadiness = os.obligations.bulkUpdateReadiness.handler(
  async ({ input, context }) => {
    await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
    const { scoped, tenant, userId } = requireTenant(context)
    const result = await bulkUpdateObligationReadiness(scoped, userId, input)
    if (result.updatedCount > 0) {
      await enqueueDashboardBriefRefresh(context.env, {
        firmId: tenant.firmId,
        reason: 'readiness_change',
      }).catch(() => false)
    }
    return result
  },
)

export const obligationsHandlers = {
  createBatch,
  updateDueDate,
  listByClient,
  updateStatus,
  bulkUpdateStatus,
  updateReadiness,
  decideExtension,
  bulkUpdateReadiness,
}
