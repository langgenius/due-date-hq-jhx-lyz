import type { WorkboardRow } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { os } from '../_root'

/**
 * workboard.* — read-only firm-wide obligation queue.
 *
 * Mutations (status / due date) live in `obligationsContract` so each
 * entity has exactly one canonical write surface.
 */

interface RawRow {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: WorkboardRow['status']
  migrationBatchId: string | null
  estimatedTaxDueCents: number | null
  estimatedExposureCents: number | null
  exposureStatus: WorkboardRow['exposureStatus']
  penaltyBreakdownJson: unknown
  penaltyFormulaVersion: string | null
  exposureCalculatedAt: Date | null
  createdAt: Date
  updatedAt: Date
  clientName: string
  assigneeName: string | null
  evidenceCount: number
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toRow(row: RawRow): WorkboardRow {
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
    clientName: row.clientName,
    assigneeName: row.assigneeName?.trim() || null,
    evidenceCount: row.evidenceCount,
  }
}

function parsePenaltyBreakdown(value: unknown): WorkboardRow['penaltyBreakdown'] {
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

const list = os.workboard.list.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)

  const repoInput: {
    status?: WorkboardRow['status'][]
    search?: string
    assigneeName?: string
    owner?: 'unassigned'
    due?: 'overdue'
    dueWithinDays?: number
    exposureStatus?: WorkboardRow['exposureStatus']
    needsEvidence?: boolean
    asOfDate?: string
    sort?: 'due_asc' | 'due_desc' | 'updated_desc'
    cursor?: string | null
    limit?: number
  } = {}
  if (input.status !== undefined) repoInput.status = input.status
  if (input.search !== undefined) repoInput.search = input.search
  if (input.assigneeName !== undefined) repoInput.assigneeName = input.assigneeName
  if (input.owner !== undefined) repoInput.owner = input.owner
  if (input.due !== undefined) repoInput.due = input.due
  if (input.dueWithinDays !== undefined) repoInput.dueWithinDays = input.dueWithinDays
  if (input.exposureStatus !== undefined) repoInput.exposureStatus = input.exposureStatus
  if (input.needsEvidence !== undefined) repoInput.needsEvidence = input.needsEvidence
  if (input.asOfDate !== undefined) repoInput.asOfDate = input.asOfDate
  if (input.sort !== undefined) repoInput.sort = input.sort
  if (input.cursor !== undefined) repoInput.cursor = input.cursor
  if (input.limit !== undefined) repoInput.limit = input.limit

  const result = await scoped.workboard.list(repoInput)

  return {
    rows: result.rows.map(toRow),
    nextCursor: result.nextCursor,
  }
})

export const workboardHandlers = { list }
