import { ORPCError } from '@orpc/server'
import type { ObligationInstancePublic } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { os } from '../_root'

/**
 * obligations.* — Demo Sprint subset of the Obligation Domain Contract.
 *
 * Authority:
 *   - packages/contracts/src/obligations.ts (frozen contract)
 *   - docs/dev-file/06 §4.1 (procedures call scoped repo only)
 *
 * Scope (Day 3): unblock Migration Step 4 commit. We expose createBatch
 * and listByClient. `updateDueDate` belongs to the LYZ workboard /
 * pulse-apply path and stays a stub.
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
  migrationBatchId: string | null
  createdAt: Date
  updatedAt: Date
}

function toIsoDate(d: Date): string {
  // contract uses .date() (YYYY-MM-DD), not full datetime — slice the ISO.
  return d.toISOString().slice(0, 10)
}

function toPublic(row: ObligationRow): ObligationInstancePublic {
  return {
    id: row.id,
    firmId: row.firmId,
    clientId: row.clientId,
    taxType: row.taxType,
    taxYear: row.taxYear,
    baseDueDate: toIsoDate(row.baseDueDate),
    currentDueDate: toIsoDate(row.currentDueDate),
    status: row.status,
    migrationBatchId: row.migrationBatchId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

const createBatch = os.obligations.createBatch.handler(async ({ input, context }) => {
  const { scoped, userId } = requireTenant(context)

  const repoInputs = input.obligations.map((o) => {
    const repoInput: {
      clientId: string
      taxType: string
      taxYear: number | null
      baseDueDate: Date
      currentDueDate: Date
      status?: ObligationInstancePublic['status']
      migrationBatchId: string | null
    } = {
      clientId: o.clientId,
      taxType: o.taxType,
      taxYear: o.taxYear ?? null,
      baseDueDate: new Date(o.baseDueDate),
      currentDueDate: o.currentDueDate ? new Date(o.currentDueDate) : new Date(o.baseDueDate),
      migrationBatchId: o.migrationBatchId ?? null,
    }
    if (o.status !== undefined) repoInput.status = o.status
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

  return { obligations: allRows.map(toPublic) }
})

const listByClient = os.obligations.listByClient.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const rows = await scoped.obligations.listByClient(input.clientId)
  return rows.map(toPublic)
})

export const obligationsHandlers = {
  createBatch,
  listByClient,
}
