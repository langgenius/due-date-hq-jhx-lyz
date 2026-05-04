import { ORPCError } from '@orpc/server'
import type {
  ObligationBulkStatusUpdateInput,
  ObligationBulkStatusUpdateOutput,
  ObligationBulkReadinessUpdateInput,
  ObligationBulkReadinessUpdateOutput,
  ObligationExtensionDecisionInput,
  ObligationExtensionDecisionOutput,
  ObligationInstancePublic,
  ObligationReadinessUpdateInput,
  ObligationReadinessUpdateOutput,
  ObligationStatusUpdateInput,
  ObligationStatusUpdateOutput,
} from '@duedatehq/contracts'
import { defaultReadinessForStatus } from '@duedatehq/core/obligation-workflow'
import type { ScopedRepo } from '@duedatehq/ports/scoped'
import { calculateAccruedPenalty } from '../_penalty-exposure'

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

interface ClientPenaltyFacts {
  id: string
  entityType?: string | null
  state?: string | null
  estimatedTaxLiabilityCents?: number | null
  equityOwnerCount?: number | null
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function toObligationPublic(
  row: ObligationRow,
  opts: { client?: ClientPenaltyFacts | null | undefined; asOfDate?: string | Date } = {},
): ObligationInstancePublic {
  const penaltyAsOfDate =
    opts.asOfDate instanceof Date
      ? opts.asOfDate.toISOString().slice(0, 10)
      : (opts.asOfDate ?? new Date().toISOString().slice(0, 10))
  const accrued = opts.client
    ? calculateAccruedPenalty(opts.client, row, penaltyAsOfDate)
    : {
        accruedPenaltyCents: null,
        accruedPenaltyStatus: 'unsupported' as const,
        accruedPenaltyBreakdown: [],
        penaltyAsOfDate,
      }
  return {
    id: row.id,
    firmId: row.firmId,
    clientId: row.clientId,
    taxType: row.taxType,
    taxYear: row.taxYear,
    baseDueDate: toIsoDate(row.baseDueDate),
    currentDueDate: toIsoDate(row.currentDueDate),
    status: row.status,
    readiness: row.readiness,
    extensionDecision: row.extensionDecision,
    extensionMemo: row.extensionMemo,
    extensionSource: row.extensionSource,
    extensionExpectedDueDate: row.extensionExpectedDueDate
      ? toIsoDate(row.extensionExpectedDueDate)
      : null,
    extensionDecidedAt: row.extensionDecidedAt?.toISOString() ?? null,
    extensionDecidedByUserId: row.extensionDecidedByUserId,
    migrationBatchId: row.migrationBatchId,
    estimatedTaxDueCents: row.estimatedTaxDueCents,
    estimatedExposureCents: row.estimatedExposureCents,
    exposureStatus: row.exposureStatus,
    penaltyBreakdown: parsePenaltyBreakdown(row.penaltyBreakdownJson),
    accruedPenaltyCents: accrued.accruedPenaltyCents,
    accruedPenaltyStatus: accrued.accruedPenaltyStatus,
    accruedPenaltyBreakdown: accrued.accruedPenaltyBreakdown,
    penaltyAsOfDate: accrued.penaltyAsOfDate,
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

function bulkReadinessForStatus(
  status: ObligationInstancePublic['status'],
): ObligationInstancePublic['readiness'] | undefined {
  if (status === 'pending' || status === 'in_progress') return undefined
  return defaultReadinessForStatus(status, undefined)
}

async function toObligationPublicFromScoped(
  scoped: ScopedRepo,
  row: ObligationRow,
): Promise<ObligationInstancePublic> {
  const client = await scoped.clients.findById(row.clientId)
  return toObligationPublic(row, { client })
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
      obligation: await toObligationPublicFromScoped(scoped, before),
      auditId: '00000000-0000-0000-0000-000000000000',
    }
  }

  const readiness = defaultReadinessForStatus(input.status, before.readiness)
  await scoped.obligations.updateStatus(input.id, input.status, readiness)
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
    before: { status: string; readiness: string }
    after: { status: string; readiness: string }
    reason?: string
  } = {
    actorId: userId,
    entityType: 'obligation_instance',
    entityId: input.id,
    action: 'obligation.status.updated',
    before: { status: before.status, readiness: before.readiness },
    after: { status: input.status, readiness },
  }
  if (input.reason !== undefined) auditPayload.reason = input.reason

  const { id: auditId } = await scoped.audit.write(auditPayload)

  return {
    obligation: await toObligationPublicFromScoped(scoped, after),
    auditId,
  }
}

export async function bulkUpdateObligationStatus(
  scoped: ScopedRepo,
  userId: string,
  input: ObligationBulkStatusUpdateInput,
): Promise<ObligationBulkStatusUpdateOutput> {
  const ids = [...new Set(input.ids)]
  const beforeRows = await scoped.obligations.findManyByIds(ids)
  if (beforeRows.length !== ids.length) {
    throw new ORPCError('NOT_FOUND', {
      message: 'One or more selected obligations were not found in the current firm.',
    })
  }

  const changedRows = beforeRows.filter((row) => row.status !== input.status)
  if (changedRows.length === 0) {
    return { updatedCount: 0, auditIds: [] }
  }

  const readiness = bulkReadinessForStatus(input.status)
  await scoped.obligations.updateStatusMany(
    changedRows.map((row) => row.id),
    input.status,
    readiness,
  )
  const afterRows = await scoped.obligations.findManyByIds(changedRows.map((row) => row.id))
  const afterById = new Map(afterRows.map((row) => [row.id, row]))

  const { ids: auditIds } = await scoped.audit.writeBatch(
    changedRows.map((before) => {
      const event: Parameters<typeof scoped.audit.writeBatch>[0][number] = {
        actorId: userId,
        entityType: 'obligation_instance',
        entityId: before.id,
        action: 'obligation.status.updated',
        before: { status: before.status, readiness: before.readiness },
        after: {
          status: afterById.get(before.id)?.status ?? input.status,
          readiness: afterById.get(before.id)?.readiness ?? readiness ?? before.readiness,
        },
      }
      if (input.reason !== undefined) event.reason = input.reason
      return event
    }),
  )

  return {
    updatedCount: changedRows.length,
    auditIds,
  }
}

export async function updateObligationReadiness(
  scoped: ScopedRepo,
  userId: string,
  input: ObligationReadinessUpdateInput,
): Promise<ObligationReadinessUpdateOutput> {
  const before = await scoped.obligations.findById(input.id)
  if (!before) {
    throw new ORPCError('NOT_FOUND', {
      message: `Obligation ${input.id} not found in current firm.`,
    })
  }

  if (before.readiness === input.readiness) {
    return {
      obligation: await toObligationPublicFromScoped(scoped, before),
      auditId: '00000000-0000-0000-0000-000000000000',
    }
  }

  await scoped.obligations.updateReadiness(input.id, input.readiness)
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
    before: { readiness: string }
    after: { readiness: string }
    reason?: string
  } = {
    actorId: userId,
    entityType: 'obligation_instance',
    entityId: input.id,
    action: 'obligation.readiness.updated',
    before: { readiness: before.readiness },
    after: { readiness: input.readiness },
  }
  if (input.reason !== undefined) auditPayload.reason = input.reason

  const { id: auditId } = await scoped.audit.write(auditPayload)

  return {
    obligation: await toObligationPublicFromScoped(scoped, after),
    auditId,
  }
}

export async function decideObligationExtension(
  scoped: ScopedRepo,
  userId: string,
  input: ObligationExtensionDecisionInput,
): Promise<ObligationExtensionDecisionOutput> {
  const before = await scoped.obligations.findById(input.id)
  if (!before) {
    throw new ORPCError('NOT_FOUND', {
      message: `Obligation ${input.id} not found in current firm.`,
    })
  }

  const decidedAt = new Date()
  const memo = input.memo?.trim() || null
  const source = input.source?.trim() || null
  const expectedExtendedDueDate = input.expectedExtendedDueDate
    ? new Date(`${input.expectedExtendedDueDate}T00:00:00.000Z`)
    : null
  const nextStatus = input.decision === 'applied' ? 'extended' : before.status
  const nextReadiness = input.decision === 'applied' ? before.readiness : before.readiness

  await scoped.obligations.updateExtensionDecision(input.id, {
    decision: input.decision,
    memo,
    source,
    expectedExtendedDueDate,
    decidedAt,
    decidedByUserId: userId,
    status: nextStatus,
    readiness: nextReadiness,
  })
  const after = await scoped.obligations.findById(input.id)
  if (!after) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Updated obligation could not be re-read.',
    })
  }

  const evidence = await scoped.evidence.write({
    obligationInstanceId: input.id,
    sourceType: 'extension_decision',
    rawValue: JSON.stringify({
      decision: before.extensionDecision,
      memo: before.extensionMemo,
      source: before.extensionSource,
    }),
    normalizedValue: JSON.stringify({
      decision: input.decision,
      memo,
      source,
      expectedExtendedDueDate: input.expectedExtendedDueDate ?? null,
      paymentStillDue: true,
    }),
    appliedBy: userId,
  })

  const { id: auditId } = await scoped.audit.write({
    actorId: userId,
    entityType: 'obligation_instance',
    entityId: input.id,
    action: 'obligation.extension.decided',
    before: {
      status: before.status,
      extensionDecision: before.extensionDecision,
      extensionMemo: before.extensionMemo,
      extensionSource: before.extensionSource,
      extensionExpectedDueDate: before.extensionExpectedDueDate?.toISOString().slice(0, 10) ?? null,
    },
    after: {
      status: after.status,
      extensionDecision: after.extensionDecision,
      extensionMemo: after.extensionMemo,
      extensionSource: after.extensionSource,
      extensionExpectedDueDate: after.extensionExpectedDueDate?.toISOString().slice(0, 10) ?? null,
      paymentStillDue: true,
    },
    ...(memo ? { reason: memo } : {}),
  })

  return {
    obligation: await toObligationPublicFromScoped(scoped, after),
    auditId,
    evidenceId: evidence.id,
  }
}

export async function bulkUpdateObligationReadiness(
  scoped: ScopedRepo,
  userId: string,
  input: ObligationBulkReadinessUpdateInput,
): Promise<ObligationBulkReadinessUpdateOutput> {
  const ids = [...new Set(input.ids)]
  const beforeRows = await scoped.obligations.findManyByIds(ids)
  if (beforeRows.length !== ids.length) {
    throw new ORPCError('NOT_FOUND', {
      message: 'One or more selected obligations were not found in the current firm.',
    })
  }

  const changedRows = beforeRows.filter((row) => row.readiness !== input.readiness)
  if (changedRows.length === 0) {
    return { updatedCount: 0, auditIds: [] }
  }

  await scoped.obligations.updateReadinessMany(
    changedRows.map((row) => row.id),
    input.readiness,
  )
  const afterRows = await scoped.obligations.findManyByIds(changedRows.map((row) => row.id))
  const afterById = new Map(afterRows.map((row) => [row.id, row]))

  const { ids: auditIds } = await scoped.audit.writeBatch(
    changedRows.map((before) => {
      const event: Parameters<typeof scoped.audit.writeBatch>[0][number] = {
        actorId: userId,
        entityType: 'obligation_instance',
        entityId: before.id,
        action: 'obligation.readiness.updated',
        before: { readiness: before.readiness },
        after: { readiness: afterById.get(before.id)?.readiness ?? input.readiness },
      }
      if (input.reason !== undefined) event.reason = input.reason
      return event
    }),
  )

  return {
    updatedCount: changedRows.length,
    auditIds,
  }
}
