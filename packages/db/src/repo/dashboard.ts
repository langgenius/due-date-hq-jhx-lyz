import { asc, and, desc, eq, inArray, isNull } from 'drizzle-orm'
import type {
  DashboardBriefCreatePendingInput,
  DashboardBriefFailedInput,
  DashboardBriefReadyInput,
  DashboardBriefRow,
} from '@duedatehq/ports/dashboard'
import type { DashboardBriefScope, DashboardBriefStatus } from '@duedatehq/ports/shared'
import { OPEN_OBLIGATION_STATUSES } from '@duedatehq/core/obligation-workflow'
import type { Db } from '../client'
import { evidenceLink } from '../schema/audit'
import { client } from '../schema/clients'
import { dashboardBrief } from '../schema/dashboard'
import { obligationInstance, type ObligationStatus } from '../schema/obligations'
import { listActiveOverlayDueDates } from './overlay'

const OPEN_STATUSES = [...OPEN_OBLIGATION_STATUSES] satisfies ObligationStatus[]
const EVIDENCE_BATCH_SIZE = 90
const DAY_MS = 24 * 60 * 60 * 1000

export type DashboardSeverity = 'critical' | 'high' | 'medium' | 'neutral'
export type DashboardTriageTabKey = 'this_week' | 'this_month' | 'long_term'

export interface DashboardLoadInput {
  asOfDate: string
  windowDays?: number
  topLimit?: number
  briefScope?: DashboardBriefScope
  briefUserId?: string | null
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
  estimatedExposureCents: number | null
  exposureStatus: 'ready' | 'needs_input' | 'unsupported'
  penaltyFormulaVersion: string | null
}

export interface DashboardTopRow extends DashboardRawRow {
  severity: DashboardSeverity
  evidenceCount: number
  primaryEvidence: DashboardEvidenceRow | null
}

export interface DashboardTriageTab {
  key: DashboardTriageTabKey
  label: string
  count: number
  totalExposureCents: number
  rows: DashboardTopRow[]
}

export interface DashboardLoadResult {
  asOfDate: string
  windowDays: number
  summary: {
    openObligationCount: number
    dueThisWeekCount: number
    needsReviewCount: number
    evidenceGapCount: number
    totalExposureCents: number
    exposureReadyCount: number
    exposureNeedsInputCount: number
    exposureUnsupportedCount: number
  }
  topRows: DashboardTopRow[]
  triageTabs: DashboardTriageTab[]
  brief: DashboardBriefRow | null
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

function triageKeyForDays(daysUntilDue: number): DashboardTriageTabKey | null {
  if (daysUntilDue <= 7) return 'this_week'
  if (daysUntilDue <= 30) return 'this_month'
  if (daysUntilDue <= 180) return 'long_term'
  return null
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
  let totalExposureCents = 0
  let exposureReadyCount = 0
  let exposureNeedsInputCount = 0
  let exposureUnsupportedCount = 0
  const asOf = parseDateOnly(input.asOfDate).getTime()
  const topRows: DashboardTopRow[] = []

  for (const row of rows) {
    const daysUntilDue = Math.floor(
      (parseDateOnly(toDateOnly(row.currentDueDate)).getTime() - asOf) / DAY_MS,
    )
    const inWindow = daysUntilDue >= 0 && daysUntilDue <= windowDays
    const evidence = evidenceByObligation.get(row.obligationId) ?? []
    if (inWindow) dueThisWeekCount += 1
    if (row.status === 'review') needsReviewCount += 1
    if (evidence.length === 0) evidenceGapCount += 1
    if (inWindow && row.exposureStatus === 'ready') {
      exposureReadyCount += 1
      totalExposureCents += row.estimatedExposureCents ?? 0
    } else if (inWindow && row.exposureStatus === 'needs_input') {
      exposureNeedsInputCount += 1
    } else if (inWindow && row.exposureStatus === 'unsupported') {
      exposureUnsupportedCount += 1
    }

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
    const exposureDelta = (b.estimatedExposureCents ?? 0) - (a.estimatedExposureCents ?? 0)
    if (exposureDelta !== 0) return exposureDelta
    const dateDelta = a.currentDueDate.getTime() - b.currentDueDate.getTime()
    if (dateDelta !== 0) return dateDelta
    return a.obligationId.localeCompare(b.obligationId)
  })

  const triage = new Map<
    DashboardTriageTabKey,
    { count: number; totalExposureCents: number; rows: DashboardTopRow[] }
  >([
    ['this_week', { count: 0, totalExposureCents: 0, rows: [] }],
    ['this_month', { count: 0, totalExposureCents: 0, rows: [] }],
    ['long_term', { count: 0, totalExposureCents: 0, rows: [] }],
  ])

  for (const row of topRows) {
    const daysUntilDue = Math.floor(
      (parseDateOnly(toDateOnly(row.currentDueDate)).getTime() - asOf) / DAY_MS,
    )
    const key = triageKeyForDays(daysUntilDue)
    if (!key) continue
    const bucket = triage.get(key)
    if (!bucket) continue
    bucket.count += 1
    if (row.exposureStatus === 'ready') bucket.totalExposureCents += row.estimatedExposureCents ?? 0
    if (bucket.rows.length < topLimit) bucket.rows.push(row)
  }

  return {
    asOfDate: input.asOfDate,
    windowDays,
    summary: {
      openObligationCount: rows.length,
      dueThisWeekCount,
      needsReviewCount,
      evidenceGapCount,
      totalExposureCents,
      exposureReadyCount,
      exposureNeedsInputCount,
      exposureUnsupportedCount,
    },
    topRows: topRows.slice(0, topLimit),
    triageTabs: [
      { key: 'this_week', label: 'This Week', ...triage.get('this_week')! },
      { key: 'this_month', label: 'This Month', ...triage.get('this_month')! },
      { key: 'long_term', label: 'Long-term', ...triage.get('long_term')! },
    ],
    brief: null,
  }
}

function normalizeBrief(
  row: typeof dashboardBrief.$inferSelect,
  now = new Date(),
): DashboardBriefRow {
  const computedStatus =
    row.status === 'ready' && row.expiresAt && row.expiresAt.getTime() < now.getTime()
      ? 'stale'
      : row.status
  return {
    id: row.id,
    firmId: row.firmId,
    userId: row.userId,
    scope: row.scope,
    asOfDate: row.asOfDate,
    status: computedStatus,
    inputHash: row.inputHash,
    aiOutputId: row.aiOutputId,
    summaryText: row.summaryText,
    topObligationIds: row.topObligationIdsJson ?? [],
    citations: row.citationsJson ?? null,
    reason: row.reason,
    errorCode: row.errorCode,
    generatedAt: row.generatedAt,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function makeDashboardRepo(db: Db, firmId: string) {
  function briefScopePredicate(scope: DashboardBriefScope, userId?: string | null) {
    if (scope === 'me') {
      return userId ? eq(dashboardBrief.userId, userId) : isNull(dashboardBrief.userId)
    }
    return isNull(dashboardBrief.userId)
  }

  async function findLatestBrief(input: {
    scope: DashboardBriefScope
    asOfDate: string
    userId?: string | null
    now?: Date
  }): Promise<DashboardBriefRow | null> {
    const [row] = await db
      .select()
      .from(dashboardBrief)
      .where(
        and(
          eq(dashboardBrief.firmId, firmId),
          eq(dashboardBrief.scope, input.scope),
          eq(dashboardBrief.asOfDate, input.asOfDate),
          briefScopePredicate(input.scope, input.userId),
        ),
      )
      .orderBy(desc(dashboardBrief.updatedAt), desc(dashboardBrief.createdAt))
      .limit(1)

    return row ? normalizeBrief(row, input.now) : null
  }

  async function findBriefByHash(input: {
    scope: DashboardBriefScope
    asOfDate: string
    inputHash: string
    userId?: string | null
    statuses?: DashboardBriefStatus[]
    now?: Date
  }): Promise<DashboardBriefRow | null> {
    const statusPredicate =
      input.statuses && input.statuses.length > 0
        ? inArray(dashboardBrief.status, input.statuses)
        : undefined
    const [row] = await db
      .select()
      .from(dashboardBrief)
      .where(
        and(
          eq(dashboardBrief.firmId, firmId),
          eq(dashboardBrief.scope, input.scope),
          eq(dashboardBrief.asOfDate, input.asOfDate),
          eq(dashboardBrief.inputHash, input.inputHash),
          briefScopePredicate(input.scope, input.userId),
          statusPredicate,
        ),
      )
      .orderBy(desc(dashboardBrief.updatedAt), desc(dashboardBrief.createdAt))
      .limit(1)

    return row ? normalizeBrief(row, input.now) : null
  }

  async function requireBrief(id: string, now?: Date): Promise<DashboardBriefRow> {
    const [row] = await db
      .select()
      .from(dashboardBrief)
      .where(and(eq(dashboardBrief.firmId, firmId), eq(dashboardBrief.id, id)))
      .limit(1)
    if (!row) throw new Error('Dashboard brief not found.')
    return normalizeBrief(row, now)
  }

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
          estimatedExposureCents: obligationInstance.estimatedExposureCents,
          exposureStatus: obligationInstance.exposureStatus,
          penaltyFormulaVersion: obligationInstance.penaltyFormulaVersion,
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
      const overlayDueDates = await listActiveOverlayDueDates(
        db,
        firmId,
        rows.map((row) => row.obligationId),
      )
      const overlayRows = rows.map((row) =>
        Object.assign({}, row, {
          currentDueDate: overlayDueDates.get(row.obligationId) ?? row.currentDueDate,
        }),
      )
      const result = composeDashboardLoad(overlayRows, evidenceRows, input)
      return {
        ...result,
        brief: await findLatestBrief({
          scope: input.briefScope ?? 'firm',
          asOfDate: input.asOfDate,
          userId: input.briefUserId ?? null,
        }),
      }
    },

    findLatestBrief,
    findBriefByHash,

    async createBriefPending(input: DashboardBriefCreatePendingInput): Promise<DashboardBriefRow> {
      const now = input.now ?? new Date()
      const id = input.id ?? crypto.randomUUID()
      await db.insert(dashboardBrief).values({
        id,
        firmId,
        userId: input.scope === 'me' ? (input.userId ?? null) : null,
        scope: input.scope,
        asOfDate: input.asOfDate,
        status: 'pending',
        inputHash: input.inputHash,
        reason: input.reason,
        createdAt: now,
        updatedAt: now,
      })
      return requireBrief(id, now)
    },

    async markBriefReady(id: string, input: DashboardBriefReadyInput): Promise<DashboardBriefRow> {
      await db
        .update(dashboardBrief)
        .set({
          status: 'ready',
          aiOutputId: input.aiOutputId ?? null,
          summaryText: input.summaryText,
          topObligationIdsJson: input.topObligationIds,
          citationsJson: input.citations ?? null,
          errorCode: null,
          generatedAt: input.generatedAt,
          expiresAt: input.expiresAt,
          updatedAt: input.generatedAt,
        })
        .where(and(eq(dashboardBrief.firmId, firmId), eq(dashboardBrief.id, id)))
      return requireBrief(id, input.generatedAt)
    },

    async markBriefFailed(
      id: string,
      input: DashboardBriefFailedInput,
    ): Promise<DashboardBriefRow> {
      await db
        .update(dashboardBrief)
        .set({
          status: 'failed',
          aiOutputId: input.aiOutputId ?? null,
          errorCode: input.errorCode,
          generatedAt: input.generatedAt,
          expiresAt: input.expiresAt,
          updatedAt: input.generatedAt,
        })
        .where(and(eq(dashboardBrief.firmId, firmId), eq(dashboardBrief.id, id)))
      return requireBrief(id, input.generatedAt)
    },
  }
}

export type DashboardRepo = ReturnType<typeof makeDashboardRepo>
