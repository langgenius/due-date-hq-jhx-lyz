import { ORPCError } from '@orpc/server'
import type { ClientsRepo } from '@duedatehq/ports/clients'
import { requireTenant } from '../_context'
import { CLIENT_WRITE_ROLES, requireCurrentFirmRole } from '../_permissions'
import { os } from '../_root'
import { enqueueDashboardBriefRefresh } from '../../jobs/dashboard-brief/enqueue'
import { recalculateClientExposure } from '../_penalty-exposure'
import { toClientPublic, type ClientCreateInputForRepo, type ClientRow } from './_serializers'

/**
 * clients.* — Demo Sprint subset of the Client Domain Contract.
 *
 * Authority:
 *   - packages/contracts/src/clients.ts (frozen contract)
 *   - docs/product-design/migration-copilot/01-mvp-and-journeys.md (Step 4 commit consumer)
 *   - docs/dev-file/06 §4.1 (procedures call scoped repo only)
 *
 * Scope (Day 3): unblock Migration Step 4 commit so JHX Day 4 can flip the
 * `Import & Generate` CTA on without touching contracts again. We expose
 * create / createBatch / get / listByFirm. Workboard mutation paths
 * (status workflow / due_date update) belong to LYZ Day 3 and stay stub.
 */

export async function rereadCreatedClientBatch(
  clients: Pick<ClientsRepo, 'findManyByIds'>,
  ids: string[],
): Promise<ClientRow[]> {
  const rows = await clients.findManyByIds(ids)
  if (rows.length !== ids.length) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Created client batch could not be re-read.',
    })
  }
  return rows
}

const create = os.clients.create.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, CLIENT_WRITE_ROLES)
  const { scoped, userId } = requireTenant(context)
  const repoInput: ClientCreateInputForRepo = {
    name: input.name,
    ein: input.ein ?? null,
    state: input.state ?? null,
    county: input.county ?? null,
    entityType: input.entityType,
    email: input.email ?? null,
    notes: input.notes ?? null,
    assigneeName: input.assigneeName ?? null,
    estimatedTaxLiabilityCents: input.estimatedTaxLiabilityCents ?? null,
    estimatedTaxLiabilitySource: input.estimatedTaxLiabilitySource ?? null,
    equityOwnerCount: input.equityOwnerCount ?? null,
    migrationBatchId: input.migrationBatchId ?? null,
  }

  const { id } = await scoped.clients.create(repoInput)
  const row = await scoped.clients.findById(id)
  if (!row) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Created client could not be re-read.',
    })
  }

  await scoped.audit.write({
    actorId: userId,
    entityType: 'client',
    entityId: id,
    action: 'client.created',
  })

  return toClientPublic(row)
})

const createBatch = os.clients.createBatch.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, CLIENT_WRITE_ROLES)
  const { scoped, userId } = requireTenant(context)

  const repoInputs: ClientCreateInputForRepo[] = input.clients.map((c) => ({
    name: c.name,
    ein: c.ein ?? null,
    state: c.state ?? null,
    county: c.county ?? null,
    entityType: c.entityType,
    email: c.email ?? null,
    notes: c.notes ?? null,
    assigneeName: c.assigneeName ?? null,
    estimatedTaxLiabilityCents: c.estimatedTaxLiabilityCents ?? null,
    estimatedTaxLiabilitySource: c.estimatedTaxLiabilitySource ?? null,
    equityOwnerCount: c.equityOwnerCount ?? null,
    migrationBatchId: c.migrationBatchId ?? null,
  }))

  const { ids } = await scoped.clients.createBatch(repoInputs)

  // Single aggregated audit row to keep the audit feed readable; per-row
  // evidence_link write is the caller's job (Migration Step 4 commit).
  await scoped.audit.write({
    actorId: userId,
    entityType: 'client_batch',
    entityId: ids[0] ?? 'empty',
    action: 'client.batch_created',
    after: { count: ids.length },
  })

  const rows = await rereadCreatedClientBatch(scoped.clients, ids)

  return { clients: rows.map(toClientPublic) }
})

const get = os.clients.get.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const row = await scoped.clients.findById(input.id)
  return row ? toClientPublic(row) : null
})

const listByFirm = os.clients.listByFirm.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const rows = await scoped.clients.listByFirm(input?.limit ? { limit: input.limit } : {})
  return rows.map(toClientPublic)
})

const updatePenaltyInputs = os.clients.updatePenaltyInputs.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, CLIENT_WRITE_ROLES)
  const { scoped, tenant, userId } = requireTenant(context)
  const before = await scoped.clients.findById(input.id)
  if (!before) {
    throw new ORPCError('NOT_FOUND', {
      message: `Client ${input.id} not found in current firm.`,
    })
  }

  await scoped.clients.updatePenaltyInputs(input.id, {
    ...(input.estimatedTaxLiabilityCents !== undefined
      ? {
          estimatedTaxLiabilityCents: input.estimatedTaxLiabilityCents,
          estimatedTaxLiabilitySource:
            input.estimatedTaxLiabilityCents === null ? null : ('manual' as const),
        }
      : {}),
    ...(input.equityOwnerCount !== undefined ? { equityOwnerCount: input.equityOwnerCount } : {}),
  })
  const recalculatedObligationCount = await recalculateClientExposure(scoped, input.id)
  const after = await scoped.clients.findById(input.id)
  if (!after) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Updated client could not be re-read.',
    })
  }

  const auditEvent: Parameters<typeof scoped.audit.write>[0] = {
    actorId: userId,
    entityType: 'client',
    entityId: input.id,
    action: 'penalty.override',
    before: {
      estimatedTaxLiabilityCents: before.estimatedTaxLiabilityCents,
      equityOwnerCount: before.equityOwnerCount,
    },
    after: {
      estimatedTaxLiabilityCents: after.estimatedTaxLiabilityCents,
      equityOwnerCount: after.equityOwnerCount,
    },
  }
  if (input.reason !== undefined) auditEvent.reason = input.reason
  await scoped.audit.write(auditEvent)

  const obligations = await scoped.obligations.listByClient(input.id)
  await scoped.evidence.writeBatch(
    obligations.map((obligation) => ({
      obligationInstanceId: obligation.id,
      sourceType: 'penalty_override',
      sourceId: input.id,
      rawValue: JSON.stringify({
        estimatedTaxLiabilityCents: before.estimatedTaxLiabilityCents,
        equityOwnerCount: before.equityOwnerCount,
      }),
      normalizedValue: JSON.stringify({
        estimatedTaxLiabilityCents: after.estimatedTaxLiabilityCents,
        equityOwnerCount: after.equityOwnerCount,
      }),
      confidence: 1,
      appliedBy: userId,
    })),
  )

  await enqueueDashboardBriefRefresh(context.env, {
    firmId: tenant.firmId,
    reason: 'penalty_override',
  }).catch(() => false)

  return {
    client: toClientPublic(after),
    recalculatedObligationCount,
  }
})

export const clientsHandlers = {
  create,
  createBatch,
  get,
  listByFirm,
  updatePenaltyInputs,
}
