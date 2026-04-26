import { ORPCError } from '@orpc/server'
import type {
  ObligationInstancePublic,
  ObligationStatusUpdateInput,
  ObligationStatusUpdateOutput,
} from '@duedatehq/contracts'

// Avoid hard-importing @duedatehq/db (procedures rule); reach the type via
// dynamic-import syntax — same trick `_root.ts` and `migration/_service.ts` use.
type ScopedRepo = import('@duedatehq/db').ScopedRepo

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
  return d.toISOString().slice(0, 10)
}

export function toObligationPublic(row: ObligationRow): ObligationInstancePublic {
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

/**
 * updateObligationStatus — extracted from the procedure handler so it can be
 * unit-tested with an in-memory scoped repo + audit writer.
 *
 * Audit invariant (docs/dev-file/06 §6.1):
 *   1. read `before`,
 *   2. update,
 *   3. read `after`,
 *   4. write audit with both payloads.
 * Order matters: any reordering would let the audit drift from the
 * persisted state on failure.
 */
export async function updateObligationStatus(
  scoped: ScopedRepo,
  userId: string,
  input: ObligationStatusUpdateInput,
): Promise<ObligationStatusUpdateOutput> {
  const before = await scoped.obligations.findById(input.id)
  if (!before) {
    throw new ORPCError('NOT_FOUND', {
      message: `Obligation ${input.id} not found in current firm.`,
    })
  }

  if (before.status === input.status) {
    return {
      obligation: toObligationPublic(before),
      auditId: '00000000-0000-0000-0000-000000000000',
    }
  }

  await scoped.obligations.updateStatus(input.id, input.status)
  const after = await scoped.obligations.findById(input.id)
  if (!after) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Updated obligation could not be re-read.',
    })
  }

  const auditPayload: {
    actorId: string
    entityType: string
    entityId: string
    action: string
    before: { status: string }
    after: { status: string }
    reason?: string
  } = {
    actorId: userId,
    entityType: 'obligation',
    entityId: input.id,
    action: 'obligation.status.updated',
    before: { status: before.status },
    after: { status: input.status },
  }
  if (input.reason !== undefined) auditPayload.reason = input.reason

  const { id: auditId } = await scoped.audit.write(auditPayload)

  return {
    obligation: toObligationPublic(after),
    auditId,
  }
}
