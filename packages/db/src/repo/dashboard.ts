import { asc, and, desc, eq, inArray } from 'drizzle-orm'
import type { Db } from '../client'
import { evidenceLink } from '../schema/audit'
import { client } from '../schema/clients'
import { obligationInstance, type ObligationStatus } from '../schema/obligations'

const OPEN_STATUSES: ObligationStatus[] = ['pending', 'in_progress', 'waiting_on_client', 'review']
const EVIDENCE_BATCH_SIZE = 90
const DAY_MS = 24 * 60 * 60 * 1000

export type DashboardSeverity = 'critical' | 'high' | 'medium' | 'neutral'

export interface DashboardLoadInput {
  asOfDate: string
  windowDays?: number
  topLimit?: number
}

export interface DashboardEvidenceRow {
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
}

export interface DashboardRawRow {
  obligationId: string
  clientId: string
  clientName: string
  taxType: string
  currentDueDate: Date
  status: ObligationStatus
}

export interface DashboardTopRow extends DashboardRawRow {
  severity: DashboardSeverity
  evidenceCount: number
  primaryEvidence: DashboardEvidenceRow | null
}

export interface DashboardLoadResult {
  asOfDate: string
  windowDays: number
  summary: {
    openObligationCount: number
    dueThisWeekCount: number
    needsReviewCount: number
    evidenceGapCount: number
  }
  topRows: DashboardTopRow[]
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function severityForDueDate(
  dueDate: Date,
  asOfDate: string,
  status: ObligationStatus,
): DashboardSeverity {
  const daysUntilDue = Math.floor(
    (parseDateOnly(toDateOnly(dueDate)).getTime() - parseDateOnly(asOfDate).getTime()) / DAY_MS,
  )
  if (daysUntilDue <= 2) return 'critical'
  if (daysUntilDue <= 7) return 'high'
  if (status === 'review' || daysUntilDue <= 14) return 'medium'
  return 'neutral'
}

function severityRank(severity: DashboardSeverity): number {
  if (severity === 'critical') return 0
  if (severity === 'high') return 1
  if (severity === 'medium') return 2
  return 3
}

export function composeDashboardLoad(
  rows: DashboardRawRow[],
  evidenceRows: DashboardEvidenceRow[],
  input: DashboardLoadInput,
): DashboardLoadResult {
  const windowDays = input.windowDays ?? 7
  const topLimit = input.topLimit ?? 8
  const evidenceByObligation = new Map<string, DashboardEvidenceRow[]>()

  for (const evidence of evidenceRows) {
    if (!evidence.obligationInstanceId) continue
    const bucket = evidenceByObligation.get(evidence.obligationInstanceId) ?? []
    bucket.push(evidence)
    evidenceByObligation.set(evidence.obligationInstanceId, bucket)
  }

  for (const bucket of evidenceByObligation.values()) {
    bucket.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())
  }

  let dueThisWeekCount = 0
  let needsReviewCount = 0
  let evidenceGapCount = 0
  const asOf = parseDateOnly(input.asOfDate).getTime()
  const topRows: DashboardTopRow[] = []

  for (const row of rows) {
    const daysUntilDue = Math.floor(
      (parseDateOnly(toDateOnly(row.currentDueDate)).getTime() - asOf) / DAY_MS,
    )
    const evidence = evidenceByObligation.get(row.obligationId) ?? []
    if (daysUntilDue >= 0 && daysUntilDue <= windowDays) dueThisWeekCount += 1
    if (row.status === 'review') needsReviewCount += 1
    if (evidence.length === 0) evidenceGapCount += 1

    topRows.push({
      ...row,
      severity: severityForDueDate(row.currentDueDate, input.asOfDate, row.status),
      evidenceCount: evidence.length,
      primaryEvidence: evidence[0] ?? null,
    })
  }

  topRows.sort((a, b) => {
    const severityDelta = severityRank(a.severity) - severityRank(b.severity)
    if (severityDelta !== 0) return severityDelta
    const dateDelta = a.currentDueDate.getTime() - b.currentDueDate.getTime()
    if (dateDelta !== 0) return dateDelta
    return a.obligationId.localeCompare(b.obligationId)
  })

  return {
    asOfDate: input.asOfDate,
    windowDays,
    summary: {
      openObligationCount: rows.length,
      dueThisWeekCount,
      needsReviewCount,
      evidenceGapCount,
    },
    topRows: topRows.slice(0, topLimit),
  }
}

export function makeDashboardRepo(db: Db, firmId: string) {
  async function listEvidenceByObligations(
    obligationIds: string[],
  ): Promise<DashboardEvidenceRow[]> {
    if (obligationIds.length === 0) return []

    const reads = []
    for (let i = 0; i < obligationIds.length; i += EVIDENCE_BATCH_SIZE) {
      const chunk = obligationIds.slice(i, i + EVIDENCE_BATCH_SIZE)
      reads.push(
        db
          .select({
            id: evidenceLink.id,
            obligationInstanceId: evidenceLink.obligationInstanceId,
            aiOutputId: evidenceLink.aiOutputId,
            sourceType: evidenceLink.sourceType,
            sourceId: evidenceLink.sourceId,
            sourceUrl: evidenceLink.sourceUrl,
            verbatimQuote: evidenceLink.verbatimQuote,
            rawValue: evidenceLink.rawValue,
            normalizedValue: evidenceLink.normalizedValue,
            confidence: evidenceLink.confidence,
            model: evidenceLink.model,
            appliedAt: evidenceLink.appliedAt,
          })
          .from(evidenceLink)
          .where(
            and(eq(evidenceLink.firmId, firmId), inArray(evidenceLink.obligationInstanceId, chunk)),
          )
          .orderBy(desc(evidenceLink.appliedAt)),
      )
    }

    return (await Promise.all(reads)).flat()
  }

  return {
    firmId,

    async load(input: DashboardLoadInput): Promise<DashboardLoadResult> {
      const rows = await db
        .select({
          obligationId: obligationInstance.id,
          clientId: obligationInstance.clientId,
          clientName: client.name,
          taxType: obligationInstance.taxType,
          currentDueDate: obligationInstance.currentDueDate,
          status: obligationInstance.status,
        })
        .from(obligationInstance)
        .innerJoin(client, eq(obligationInstance.clientId, client.id))
        .where(
          and(
            eq(obligationInstance.firmId, firmId),
            eq(client.firmId, firmId),
            inArray(obligationInstance.status, OPEN_STATUSES),
          ),
        )
        .orderBy(asc(obligationInstance.currentDueDate), asc(obligationInstance.id))
        .limit(1000)

      const evidenceRows = await listEvidenceByObligations(rows.map((row) => row.obligationId))
      return composeDashboardLoad(rows, evidenceRows, input)
    },
  }
}

export type DashboardRepo = ReturnType<typeof makeDashboardRepo>
