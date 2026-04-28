import { ORPCError } from '@orpc/server'
import type { ObligationInstancePublic } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import {
  MIGRATION_RUN_ROLES,
  OBLIGATION_STATUS_WRITE_ROLES,
  requireCurrentFirmRole,
} from '../_permissions'
import { os } from '../_root'
import { toObligationPublic, updateObligationStatus } from './_service'

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
  migrationBatchId: string | null
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

  return { obligations: allRows.map(toObligationPublic) }
})

const listByClient = os.obligations.listByClient.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const rows = await scoped.obligations.listByClient(input.clientId)
  return rows.map(toObligationPublic)
})

const updateStatus = os.obligations.updateStatus.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, userId } = requireTenant(context)
  return updateObligationStatus(scoped, userId, input)
})

export const obligationsHandlers = {
  createBatch,
  listByClient,
  updateStatus,
}
