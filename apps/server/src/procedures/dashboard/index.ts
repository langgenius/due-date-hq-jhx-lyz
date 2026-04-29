import type {
  DashboardBriefPublic,
  DashboardLoadOutput,
  DashboardTopRow,
} from '@duedatehq/contracts'
import type { DashboardBriefRow } from '@duedatehq/ports'
import { enqueueDashboardBriefRefresh } from '../../jobs/dashboard-brief/enqueue'
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

function toBriefPublic(row: DashboardBriefRow | null): DashboardBriefPublic | null {
  if (!row) return null
  return {
    status: row.status,
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    text: row.summaryText,
    citations: row.citations ?? null,
    aiOutputId: row.aiOutputId,
    errorCode: row.errorCode,
  }
}

const load = os.dashboard.load.handler(async ({ input, context }) => {
  const { scoped, tenant, userId } = requireTenant(context)
  const asOfDate = input?.asOfDate ?? dateInTimezone(tenant.timezone)
  const windowDays = input?.windowDays ?? 7
  const topLimit = input?.topLimit ?? 8
  const briefScope = input?.briefScope ?? 'firm'
  const result = await scoped.dashboard.load({
    asOfDate,
    windowDays,
    topLimit,
    briefScope,
    briefUserId: briefScope === 'me' ? userId : null,
  })

  return {
    asOfDate: result.asOfDate,
    windowDays: result.windowDays,
    summary: result.summary,
    topRows: result.topRows.map(toTopRow),
    brief: toBriefPublic(result.brief),
  } satisfies DashboardLoadOutput
})

const requestBriefRefresh = os.dashboard.requestBriefRefresh.handler(async ({ input, context }) => {
  const { scoped, tenant, userId } = requireTenant(context)
  const scope = input?.scope ?? 'firm'
  const asOfDate = dateInTimezone(tenant.timezone)
  const queued = await enqueueDashboardBriefRefresh(context.env, {
    firmId: tenant.firmId,
    scope,
    userId: scope === 'me' ? userId : null,
    asOfDate,
    reason: 'manual_refresh',
    bypassDebounce: true,
  })
  const brief = await scoped.dashboard.findLatestBrief({
    scope,
    asOfDate,
    userId: scope === 'me' ? userId : null,
  })
  return { queued, brief: toBriefPublic(brief) }
})

export const dashboardHandlers = { load, requestBriefRefresh }
