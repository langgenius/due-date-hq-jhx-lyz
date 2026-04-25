import { ORPCError } from '@orpc/server'
import { requireTenant } from '../_context'
import { os } from '../_root'
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

const create = os.clients.create.handler(async ({ input, context }) => {
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

  // Re-read for the public output. listByFirm is fine for Demo size; Phase 0
  // can swap to a targeted IN clause once we cross 500 rows / batch.
  const allClients = await scoped.clients.listByFirm()
  const idSet = new Set(ids)
  const rows = allClients.filter((c: ClientRow) => idSet.has(c.id))

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

export const clientsHandlers = {
  create,
  createBatch,
  get,
  listByFirm,
}
