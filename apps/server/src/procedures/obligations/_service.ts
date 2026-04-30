import { ORPCError } from '@orpc/server'
import type {
  ObligationInstancePublic,
  ObligationStatusUpdateInput,
  ObligationStatusUpdateOutput,
} from '@duedatehq/contracts'
import type { ScopedRepo } from '@duedatehq/ports/scoped'

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
  estimatedTaxDueCents: number | null
  estimatedExposureCents: number | null
  exposureStatus: ObligationInstancePublic['exposureStatus']
  penaltyBreakdownJson: unknown
  penaltyFormulaVersion: string | null
  exposureCalculatedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
    estimatedTaxDueCents: row.estimatedTaxDueCents,
    estimatedExposureCents: row.estimatedExposureCents,
    exposureStatus: row.exposureStatus,
    penaltyBreakdown: parsePenaltyBreakdown(row.penaltyBreakdownJson),
    penaltyFormulaVersion: row.penaltyFormulaVersion,
    exposureCalculatedAt: row.exposureCalculatedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function parsePenaltyBreakdown(value: unknown): ObligationInstancePublic['penaltyBreakdown'] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    const key = item.key
    const label = item.label
    const amountCents = item.amountCents
    const formula = item.formula
    if (
      typeof key !== 'string' ||
      typeof label !== 'string' ||
      typeof amountCents !== 'number' ||
      typeof formula !== 'string'
    ) {
      return []
    }
    return [
      {
        key,
        label,
        amountCents,
        formula,
      },
    ]
  })
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
    entityType: 'obligation_instance',
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
