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
  clientState: string | null
  clientCounty: string | null
  assigneeName: string | null
  readiness: WorkboardRow['readiness']
  daysUntilDue: number
  evidenceCount: number
}

const STATE_CODE_RE = /^[A-Z]{2}$/

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeStateCode(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase()
  return normalized && STATE_CODE_RE.test(normalized) ? normalized : null
}

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function toRow(row: RawRow, opts: { hideDollars?: boolean } = {}): WorkboardRow {
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
    estimatedTaxDueCents: opts.hideDollars ? null : row.estimatedTaxDueCents,
    estimatedExposureCents: opts.hideDollars ? null : row.estimatedExposureCents,
    exposureStatus: row.exposureStatus,
    penaltyBreakdown: parsePenaltyBreakdown(row.penaltyBreakdownJson),
    penaltyFormulaVersion: row.penaltyFormulaVersion,
    exposureCalculatedAt: row.exposureCalculatedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    clientName: row.clientName,
    clientState: normalizeStateCode(row.clientState),
    clientCounty: normalizeNullableText(row.clientCounty),
    assigneeName: row.assigneeName?.trim() || null,
    readiness: row.readiness,
    daysUntilDue: row.daysUntilDue,
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
  const { scoped, tenant, userId } = requireTenant(context)
  const actor = await context.vars.members?.findMembership(tenant.firmId, userId)
  const hideDollars = actor?.role === 'coordinator' && !tenant.coordinatorCanSeeDollars

  const repoInput: NonNullable<Parameters<typeof scoped.workboard.list>[0]> = {}
  if (input.status !== undefined) repoInput.status = input.status
  if (input.search !== undefined) repoInput.search = input.search
  if (input.clientIds !== undefined) repoInput.clientIds = input.clientIds
  if (input.states !== undefined) repoInput.states = input.states
  if (input.counties !== undefined) repoInput.counties = input.counties
  if (input.taxTypes !== undefined) repoInput.taxTypes = input.taxTypes
  if (input.assigneeName !== undefined) repoInput.assigneeName = input.assigneeName
  if (input.assigneeNames !== undefined) repoInput.assigneeNames = input.assigneeNames
  if (input.owner !== undefined) repoInput.owner = input.owner
  if (input.due !== undefined) repoInput.due = input.due
  if (input.dueWithinDays !== undefined) repoInput.dueWithinDays = input.dueWithinDays
  if (input.exposureStatus !== undefined) repoInput.exposureStatus = input.exposureStatus
  if (input.readiness !== undefined) repoInput.readiness = input.readiness
  if (!hideDollars && input.minExposureCents !== undefined) {
    repoInput.minExposureCents = input.minExposureCents
  }
  if (!hideDollars && input.maxExposureCents !== undefined) {
    repoInput.maxExposureCents = input.maxExposureCents
  }
  if (input.minDaysUntilDue !== undefined) repoInput.minDaysUntilDue = input.minDaysUntilDue
  if (input.maxDaysUntilDue !== undefined) repoInput.maxDaysUntilDue = input.maxDaysUntilDue
  if (input.needsEvidence !== undefined) repoInput.needsEvidence = input.needsEvidence
  if (input.asOfDate !== undefined) repoInput.asOfDate = input.asOfDate
  if (input.sort !== undefined) repoInput.sort = input.sort
  if (input.cursor !== undefined) repoInput.cursor = input.cursor
  if (input.limit !== undefined) repoInput.limit = input.limit

  const result = await scoped.workboard.list(repoInput)

  return {
    rows: result.rows.map((row) => toRow(row, { hideDollars })),
    nextCursor: result.nextCursor,
  }
})

const facets = os.workboard.facets.handler(async ({ context }) => {
  const { scoped } = requireTenant(context)
  return scoped.workboard.facets()
})

export const workboardHandlers = { list, facets }
