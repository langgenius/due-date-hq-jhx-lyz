import type { DashboardLoadOutput, DashboardTopRow } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { os } from '../_root'

interface DashboardRepoTopRow {
  obligationId: string
  clientId: string
  clientName: string
  taxType: string
  currentDueDate: Date
  status: DashboardTopRow['status']
  severity: DashboardTopRow['severity']
  evidenceCount: number
  primaryEvidence: {
    id: string
    obligationInstanceId: string | null
    aiOutputId: string | null
    sourceType: string
    sourceId: string | null
    sourceUrl: string | null
    verbatimQuote: string | null
    rawValue: string | null
    normalizedValue: string | null
    confidence: number | null
    model: string | null
    appliedAt: Date
  } | null
}

function dateInTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toTopRow(row: DashboardRepoTopRow): DashboardTopRow {
  return {
    obligationId: row.obligationId,
    clientId: row.clientId,
    clientName: row.clientName,
    taxType: row.taxType,
    currentDueDate: toDateOnly(row.currentDueDate),
    status: row.status,
    severity: row.severity,
    evidenceCount: row.evidenceCount,
    primaryEvidence: row.primaryEvidence
      ? {
          id: row.primaryEvidence.id,
          obligationInstanceId: row.primaryEvidence.obligationInstanceId,
          aiOutputId: row.primaryEvidence.aiOutputId,
          sourceType: row.primaryEvidence.sourceType,
          sourceId: row.primaryEvidence.sourceId,
          sourceUrl: row.primaryEvidence.sourceUrl,
          verbatimQuote: row.primaryEvidence.verbatimQuote,
          rawValue: row.primaryEvidence.rawValue,
          normalizedValue: row.primaryEvidence.normalizedValue,
          confidence: row.primaryEvidence.confidence,
          model: row.primaryEvidence.model,
          appliedAt: row.primaryEvidence.appliedAt.toISOString(),
        }
      : null,
  }
}

const load = os.dashboard.load.handler(async ({ input, context }) => {
  const { scoped, tenant } = requireTenant(context)
  const asOfDate = input?.asOfDate ?? dateInTimezone(tenant.timezone)
  const windowDays = input?.windowDays ?? 7
  const topLimit = input?.topLimit ?? 8
  const result = await scoped.dashboard.load({ asOfDate, windowDays, topLimit })

  return {
    asOfDate: result.asOfDate,
    windowDays: result.windowDays,
    summary: result.summary,
    topRows: result.topRows.map(toTopRow),
  } satisfies DashboardLoadOutput
})

export const dashboardHandlers = { load }
