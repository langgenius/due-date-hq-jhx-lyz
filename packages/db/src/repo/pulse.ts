import { and, asc, desc, eq, inArray, isNull, notInArray } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { Db } from '../client'
import { auditEvent, evidenceLink, type NewAuditEvent, type NewEvidenceLink } from '../schema/audit'
import { client, type ClientEntityType } from '../schema/clients'
import { emailOutbox, type NewEmailOutbox } from '../schema/notifications'
import { obligationInstance, type ObligationStatus } from '../schema/obligations'
import {
  pulse,
  pulseApplication,
  pulseFirmAlert,
  type NewPulse,
  type NewPulseApplication,
  type NewPulseFirmAlert,
  type PulseFirmAlertStatus,
  type PulseStatus,
} from '../schema/pulse'

const OPEN_OBLIGATION_STATUSES: ObligationStatus[] = [
  'pending',
  'in_progress',
  'waiting_on_client',
  'review',
]
const APPLICATION_BATCH_SIZE = Math.floor(100 / 9)
const EVIDENCE_BATCH_SIZE = Math.floor(100 / 17)
const AUDIT_BATCH_SIZE = Math.floor(100 / 12)
const EMAIL_BATCH_SIZE = 1
const REVERT_WINDOW_MS = 24 * 60 * 60 * 1000

export type PulseAffectedClientStatus = 'eligible' | 'needs_review' | 'already_applied' | 'reverted'

export interface PulseAlertRow {
  id: string
  pulseId: string
  status: PulseFirmAlertStatus
  title: string
  source: string
  sourceUrl: string
  summary: string
  publishedAt: Date
  matchedCount: number
  needsReviewCount: number
  confidence: number
  isSample: boolean
}

export interface PulseAffectedClientRow {
  obligationId: string
  clientId: string
  clientName: string
  state: string | null
  county: string | null
  entityType: ClientEntityType
  taxType: string
  currentDueDate: Date
  newDueDate: Date
  status: ObligationStatus
  matchStatus: PulseAffectedClientStatus
  reason: string | null
}

export interface PulseDetailRow {
  alert: PulseAlertRow
  jurisdiction: string
  counties: string[]
  forms: string[]
  entityTypes: ClientEntityType[]
  originalDueDate: Date
  newDueDate: Date
  effectiveFrom: Date | null
  sourceExcerpt: string
  reviewedAt: Date | null
  affectedClients: PulseAffectedClientRow[]
}

export interface PulseApplyResult {
  alert: PulseAlertRow
  appliedCount: number
  auditIds: string[]
  evidenceIds: string[]
  applicationIds: string[]
  emailOutboxId: string
  revertExpiresAt: Date
}

export interface PulseDismissResult {
  alert: PulseAlertRow
  auditId: string
}

export interface PulseRevertResult {
  alert: PulseAlertRow
  revertedCount: number
  auditIds: string[]
  evidenceIds: string[]
}

export interface PulseSeedInput {
  pulseId?: string
  alertId?: string
  source: string
  sourceUrl: string
  rawR2Key?: string | null
  publishedAt: Date
  aiSummary: string
  verbatimQuote: string
  parsedJurisdiction: string
  parsedCounties: string[]
  parsedForms: string[]
  parsedEntityTypes: ClientEntityType[]
  parsedOriginalDueDate: Date
  parsedNewDueDate: Date
  parsedEffectiveFrom?: Date | null
  confidence: number
  reviewedBy?: string | null
  reviewedAt?: Date | null
  requiresHumanReview?: boolean
  isSample?: boolean
  matchedCount?: number
  needsReviewCount?: number
}

interface AlertJoinedRow {
  alertId: string
  pulseId: string
  alertStatus: PulseFirmAlertStatus
  matchedCount: number
  needsReviewCount: number
  source: string
  sourceUrl: string
  publishedAt: Date
  aiSummary: string
  verbatimQuote: string
  parsedJurisdiction: string
  parsedCounties: string[]
  parsedForms: string[]
  parsedEntityTypes: string[]
  parsedOriginalDueDate: Date
  parsedNewDueDate: Date
  parsedEffectiveFrom: Date | null
  confidence: number
  pulseStatus: PulseStatus
  reviewedBy: string | null
  reviewedAt: Date | null
  isSample: boolean
}

interface CandidateRow {
  obligationId: string
  clientId: string
  clientName: string
  state: string | null
  county: string | null
  entityType: ClientEntityType
  taxType: string
  currentDueDate: Date
  status: ObligationStatus
}

interface ApplicationRow {
  id: string
  obligationId: string
  clientId: string
  clientName: string
  state: string | null
  county: string | null
  entityType: ClientEntityType
  taxType: string
  currentDueDate: Date
  status: ObligationStatus
  appliedAt: Date
  revertedAt: Date | null
  beforeDueDate: Date
  afterDueDate: Date
}

export class PulseRepoError extends Error {
  constructor(readonly code: 'not_found' | 'conflict' | 'revert_expired' | 'no_eligible') {
    super(`Pulse repo error: ${code}`)
    this.name = 'PulseRepoError'
  }
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function sameTimestamp(left: Date, right: Date): boolean {
  return left.getTime() === right.getTime()
}

function toNonEmptyBatch<T>(items: T[]): [T, ...T[]] {
  const [first, ...rest] = items
  if (first === undefined) throw new Error('Expected at least one D1 batch statement')
  return [first, ...rest]
}

function toAlert(row: AlertJoinedRow): PulseAlertRow {
  return {
    id: row.alertId,
    pulseId: row.pulseId,
    status: row.alertStatus,
    title: row.aiSummary,
    source: row.source,
    sourceUrl: row.sourceUrl,
    summary: row.aiSummary,
    publishedAt: row.publishedAt,
    matchedCount: row.matchedCount,
    needsReviewCount: row.needsReviewCount,
    confidence: row.confidence,
    isSample: row.isSample,
  }
}

function applicationStatus(row: ApplicationRow): PulseAffectedClientStatus {
  return row.revertedAt ? 'reverted' : 'already_applied'
}

function compareAffected(a: PulseAffectedClientRow, b: PulseAffectedClientRow): number {
  const statusRank: Record<PulseAffectedClientStatus, number> = {
    eligible: 0,
    needs_review: 1,
    already_applied: 2,
    reverted: 3,
  }
  const statusDelta = statusRank[a.matchStatus] - statusRank[b.matchStatus]
  if (statusDelta !== 0) return statusDelta
  const dateDelta = a.currentDueDate.getTime() - b.currentDueDate.getTime()
  if (dateDelta !== 0) return dateDelta
  return a.clientName.localeCompare(b.clientName)
}

function chunkRows<T>(rows: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size))
  return chunks
}

function isClientEntityType(value: string): value is ClientEntityType {
  return [
    'llc',
    's_corp',
    'partnership',
    'c_corp',
    'sole_prop',
    'trust',
    'individual',
    'other',
  ].includes(value)
}

function toClientEntityTypes(values: string[]): ClientEntityType[] {
  return values.filter(isClientEntityType)
}

export function makePulseRepo(db: Db, firmId: string) {
  async function getAlert(alertId: string): Promise<AlertJoinedRow> {
    const rows = await db
      .select({
        alertId: pulseFirmAlert.id,
        pulseId: pulse.id,
        alertStatus: pulseFirmAlert.status,
        matchedCount: pulseFirmAlert.matchedCount,
        needsReviewCount: pulseFirmAlert.needsReviewCount,
        source: pulse.source,
        sourceUrl: pulse.sourceUrl,
        publishedAt: pulse.publishedAt,
        aiSummary: pulse.aiSummary,
        verbatimQuote: pulse.verbatimQuote,
        parsedJurisdiction: pulse.parsedJurisdiction,
        parsedCounties: pulse.parsedCounties,
        parsedForms: pulse.parsedForms,
        parsedEntityTypes: pulse.parsedEntityTypes,
        parsedOriginalDueDate: pulse.parsedOriginalDueDate,
        parsedNewDueDate: pulse.parsedNewDueDate,
        parsedEffectiveFrom: pulse.parsedEffectiveFrom,
        confidence: pulse.confidence,
        pulseStatus: pulse.status,
        reviewedBy: pulse.reviewedBy,
        reviewedAt: pulse.reviewedAt,
        isSample: pulse.isSample,
      })
      .from(pulseFirmAlert)
      .innerJoin(pulse, eq(pulseFirmAlert.pulseId, pulse.id))
      .where(and(eq(pulseFirmAlert.firmId, firmId), eq(pulseFirmAlert.id, alertId)))
      .limit(1)

    const row = rows[0]
    if (!row || row.pulseStatus !== 'approved') throw new PulseRepoError('not_found')
    return row
  }

  async function listCandidateRows(alert: AlertJoinedRow): Promise<PulseAffectedClientRow[]> {
    const forms = alert.parsedForms
    const entityTypes = toClientEntityTypes(alert.parsedEntityTypes)
    if (forms.length === 0 || entityTypes.length === 0) return []

    const rows = await db
      .select({
        obligationId: obligationInstance.id,
        clientId: client.id,
        clientName: client.name,
        state: client.state,
        county: client.county,
        entityType: client.entityType,
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
          eq(client.state, alert.parsedJurisdiction),
          inArray(client.entityType, entityTypes),
          inArray(obligationInstance.taxType, forms),
          inArray(obligationInstance.status, OPEN_OBLIGATION_STATUSES),
          eq(obligationInstance.currentDueDate, alert.parsedOriginalDueDate),
        ),
      )
      .orderBy(asc(obligationInstance.currentDueDate), asc(client.name))

    const counties = new Set(alert.parsedCounties.map((county) => county.toLowerCase()))
    return rows
      .map((row: CandidateRow): PulseAffectedClientRow | null => {
        if (counties.size > 0) {
          if (!row.county) {
            return {
              obligationId: row.obligationId,
              clientId: row.clientId,
              clientName: row.clientName,
              state: row.state,
              county: row.county,
              entityType: row.entityType,
              taxType: row.taxType,
              currentDueDate: row.currentDueDate,
              status: row.status,
              newDueDate: alert.parsedNewDueDate,
              matchStatus: 'needs_review',
              reason: 'Client county is missing; confirm county applicability before applying.',
            }
          }
          if (!counties.has(row.county.toLowerCase())) return null
        }

        return {
          obligationId: row.obligationId,
          clientId: row.clientId,
          clientName: row.clientName,
          state: row.state,
          county: row.county,
          entityType: row.entityType,
          taxType: row.taxType,
          currentDueDate: row.currentDueDate,
          status: row.status,
          newDueDate: alert.parsedNewDueDate,
          matchStatus: 'eligible',
          reason: null,
        }
      })
      .filter((row): row is PulseAffectedClientRow => row !== null)
  }

  async function listApplicationRows(pulseId: string): Promise<PulseAffectedClientRow[]> {
    const rows = await db
      .select({
        id: pulseApplication.id,
        obligationId: pulseApplication.obligationInstanceId,
        clientId: pulseApplication.clientId,
        clientName: client.name,
        state: client.state,
        county: client.county,
        entityType: client.entityType,
        taxType: obligationInstance.taxType,
        currentDueDate: obligationInstance.currentDueDate,
        status: obligationInstance.status,
        appliedAt: pulseApplication.appliedAt,
        revertedAt: pulseApplication.revertedAt,
        beforeDueDate: pulseApplication.beforeDueDate,
        afterDueDate: pulseApplication.afterDueDate,
      })
      .from(pulseApplication)
      .innerJoin(
        obligationInstance,
        eq(pulseApplication.obligationInstanceId, obligationInstance.id),
      )
      .innerJoin(client, eq(pulseApplication.clientId, client.id))
      .where(and(eq(pulseApplication.firmId, firmId), eq(pulseApplication.pulseId, pulseId)))
      .orderBy(asc(client.name), asc(pulseApplication.appliedAt))

    return rows.map((row: ApplicationRow) => ({
      obligationId: row.obligationId,
      clientId: row.clientId,
      clientName: row.clientName,
      state: row.state,
      county: row.county,
      entityType: row.entityType,
      taxType: row.taxType,
      currentDueDate: row.currentDueDate,
      newDueDate: row.afterDueDate,
      status: row.status,
      matchStatus: applicationStatus(row),
      reason: row.revertedAt ? 'This Pulse application has been reverted.' : 'Already applied.',
    }))
  }

  async function listSelectedRows(obligationIds: readonly string[]): Promise<CandidateRow[]> {
    if (obligationIds.length === 0) return []

    return db
      .select({
        obligationId: obligationInstance.id,
        clientId: client.id,
        clientName: client.name,
        state: client.state,
        county: client.county,
        entityType: client.entityType,
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
          inArray(obligationInstance.id, obligationIds),
        ),
      )
      .orderBy(asc(obligationInstance.currentDueDate), asc(client.name))
  }

  async function listActiveApplicationIds(
    pulseId: string,
    obligationIds: readonly string[],
  ): Promise<Set<string>> {
    if (obligationIds.length === 0) return new Set()

    const rows = await db
      .select({ obligationId: pulseApplication.obligationInstanceId })
      .from(pulseApplication)
      .where(
        and(
          eq(pulseApplication.firmId, firmId),
          eq(pulseApplication.pulseId, pulseId),
          inArray(pulseApplication.obligationInstanceId, obligationIds),
          isNull(pulseApplication.revertedAt),
        ),
      )
      .orderBy(asc(pulseApplication.appliedAt))

    return new Set(rows.map((row) => row.obligationId))
  }

  async function listFreshEligibleRows(
    alert: AlertJoinedRow,
    obligationIds: readonly string[],
  ): Promise<PulseAffectedClientRow[]> {
    if (obligationIds.length === 0) throw new PulseRepoError('no_eligible')

    const rows = await listSelectedRows(obligationIds)
    const rowsById = new Map(rows.map((row) => [row.obligationId, row]))
    if (rowsById.size !== obligationIds.length) throw new PulseRepoError('conflict')

    const activeApplicationIds = await listActiveApplicationIds(alert.pulseId, obligationIds)
    const forms = new Set(alert.parsedForms)
    const entityTypes = new Set(toClientEntityTypes(alert.parsedEntityTypes))
    const counties = new Set(alert.parsedCounties.map((county) => county.toLowerCase()))

    return obligationIds.map((obligationId) => {
      const row = rowsById.get(obligationId)
      if (!row) throw new PulseRepoError('conflict')
      if (activeApplicationIds.has(row.obligationId)) throw new PulseRepoError('conflict')
      if (row.state !== alert.parsedJurisdiction) throw new PulseRepoError('conflict')
      if (!forms.has(row.taxType)) throw new PulseRepoError('conflict')
      if (!entityTypes.has(row.entityType)) throw new PulseRepoError('conflict')
      if (!OPEN_OBLIGATION_STATUSES.includes(row.status)) throw new PulseRepoError('conflict')
      if (!sameTimestamp(row.currentDueDate, alert.parsedOriginalDueDate)) {
        throw new PulseRepoError('conflict')
      }
      if (counties.size > 0) {
        if (!row.county || !counties.has(row.county.toLowerCase())) {
          throw new PulseRepoError('conflict')
        }
      }

      return {
        obligationId: row.obligationId,
        clientId: row.clientId,
        clientName: row.clientName,
        state: row.state,
        county: row.county,
        entityType: row.entityType,
        taxType: row.taxType,
        currentDueDate: row.currentDueDate,
        status: row.status,
        newDueDate: alert.parsedNewDueDate,
        matchStatus: 'eligible',
        reason: null,
      }
    })
  }

  async function buildDetail(alert: AlertJoinedRow): Promise<PulseDetailRow> {
    const affected = new Map<string, PulseAffectedClientRow>()
    for (const row of await listCandidateRows(alert)) affected.set(row.obligationId, row)
    for (const row of await listApplicationRows(alert.pulseId)) affected.set(row.obligationId, row)

    return {
      alert: toAlert(alert),
      jurisdiction: alert.parsedJurisdiction,
      counties: alert.parsedCounties,
      forms: alert.parsedForms,
      entityTypes: toClientEntityTypes(alert.parsedEntityTypes),
      originalDueDate: alert.parsedOriginalDueDate,
      newDueDate: alert.parsedNewDueDate,
      effectiveFrom: alert.parsedEffectiveFrom,
      sourceExcerpt: alert.verbatimQuote,
      reviewedAt: alert.reviewedAt,
      affectedClients: Array.from(affected.values()).toSorted(compareAffected),
    }
  }

  async function refreshAlertCounts(
    alertId: string,
    alert: AlertJoinedRow,
  ): Promise<{
    matchedCount: number
    needsReviewCount: number
  }> {
    const detail = await buildDetail(alert)
    const matchedCount = detail.affectedClients.filter(
      (row) => row.matchStatus === 'eligible',
    ).length
    const needsReviewCount = detail.affectedClients.filter(
      (row) => row.matchStatus === 'needs_review',
    ).length

    await db
      .update(pulseFirmAlert)
      .set({ matchedCount, needsReviewCount })
      .where(and(eq(pulseFirmAlert.firmId, firmId), eq(pulseFirmAlert.id, alertId)))
    return { matchedCount, needsReviewCount }
  }

  return {
    firmId,

    async createSeedAlert(input: PulseSeedInput): Promise<{ pulseId: string; alertId: string }> {
      const pulseId = input.pulseId ?? crypto.randomUUID()
      const alertId = input.alertId ?? crypto.randomUUID()
      const reviewedAt = input.reviewedAt ?? input.publishedAt

      const pulseRow: NewPulse = {
        id: pulseId,
        source: input.source,
        sourceUrl: input.sourceUrl,
        rawR2Key: input.rawR2Key ?? null,
        publishedAt: input.publishedAt,
        aiSummary: input.aiSummary,
        verbatimQuote: input.verbatimQuote,
        parsedJurisdiction: input.parsedJurisdiction,
        parsedCounties: input.parsedCounties,
        parsedForms: input.parsedForms,
        parsedEntityTypes: input.parsedEntityTypes,
        parsedOriginalDueDate: input.parsedOriginalDueDate,
        parsedNewDueDate: input.parsedNewDueDate,
        parsedEffectiveFrom: input.parsedEffectiveFrom ?? null,
        confidence: input.confidence,
        status: 'approved',
        reviewedBy: input.reviewedBy ?? null,
        reviewedAt,
        requiresHumanReview: input.requiresHumanReview ?? true,
        isSample: input.isSample ?? true,
      }
      const alertRow: NewPulseFirmAlert = {
        id: alertId,
        pulseId,
        firmId,
        status: 'matched',
        matchedCount: input.matchedCount ?? 0,
        needsReviewCount: input.needsReviewCount ?? 0,
      }

      await db.batch([
        db.insert(pulse).values(pulseRow),
        db.insert(pulseFirmAlert).values(alertRow),
      ])
      const alert = await getAlert(alertId)
      await refreshAlertCounts(alertId, alert)
      return { pulseId, alertId }
    },

    async listAlerts(opts: { limit?: number } = {}): Promise<PulseAlertRow[]> {
      const limit = Math.min(Math.max(opts.limit ?? 5, 1), 20)
      const rows = await db
        .select({
          alertId: pulseFirmAlert.id,
          pulseId: pulse.id,
          alertStatus: pulseFirmAlert.status,
          matchedCount: pulseFirmAlert.matchedCount,
          needsReviewCount: pulseFirmAlert.needsReviewCount,
          source: pulse.source,
          sourceUrl: pulse.sourceUrl,
          publishedAt: pulse.publishedAt,
          aiSummary: pulse.aiSummary,
          verbatimQuote: pulse.verbatimQuote,
          parsedJurisdiction: pulse.parsedJurisdiction,
          parsedCounties: pulse.parsedCounties,
          parsedForms: pulse.parsedForms,
          parsedEntityTypes: pulse.parsedEntityTypes,
          parsedOriginalDueDate: pulse.parsedOriginalDueDate,
          parsedNewDueDate: pulse.parsedNewDueDate,
          parsedEffectiveFrom: pulse.parsedEffectiveFrom,
          confidence: pulse.confidence,
          pulseStatus: pulse.status,
          reviewedBy: pulse.reviewedBy,
          reviewedAt: pulse.reviewedAt,
          isSample: pulse.isSample,
        })
        .from(pulseFirmAlert)
        .innerJoin(pulse, eq(pulseFirmAlert.pulseId, pulse.id))
        .where(
          and(
            eq(pulseFirmAlert.firmId, firmId),
            eq(pulse.status, 'approved'),
            inArray(pulseFirmAlert.status, ['matched', 'partially_applied']),
          ),
        )
        .orderBy(desc(pulse.publishedAt), desc(pulseFirmAlert.updatedAt))
        .limit(limit)

      return rows.map((row) => toAlert(row))
    },

    async getDetail(alertId: string): Promise<PulseDetailRow> {
      const alert = await getAlert(alertId)
      return buildDetail(alert)
    },

    async apply(input: {
      alertId: string
      obligationIds: string[]
      userId: string
      now?: Date
    }): Promise<PulseApplyResult> {
      const alert = await getAlert(input.alertId)
      const now = input.now ?? new Date()
      const detail = await buildDetail(alert)
      const requestedIds = Array.from(new Set(input.obligationIds))
      const affectedById = new Map(detail.affectedClients.map((row) => [row.obligationId, row]))
      const selectedEligibleCount = requestedIds.filter(
        (obligationId) => affectedById.get(obligationId)?.matchStatus === 'eligible',
      ).length
      if (selectedEligibleCount === 0) {
        const selectedConflict = requestedIds.some((obligationId) => affectedById.has(obligationId))
        throw new PulseRepoError(selectedConflict ? 'conflict' : 'no_eligible')
      }
      for (const obligationId of requestedIds) {
        const row = affectedById.get(obligationId)
        if (!row) throw new PulseRepoError('conflict')
        if (row.matchStatus !== 'eligible') throw new PulseRepoError('conflict')
      }
      const eligible = await listFreshEligibleRows(alert, requestedIds)

      const revertExpiresAt = new Date(now.getTime() + REVERT_WINDOW_MS)
      const applications: NewPulseApplication[] = eligible.map((row) => ({
        id: crypto.randomUUID(),
        pulseId: alert.pulseId,
        obligationInstanceId: row.obligationId,
        clientId: row.clientId,
        firmId,
        appliedBy: input.userId,
        appliedAt: now,
        beforeDueDate: row.currentDueDate,
        afterDueDate: alert.parsedNewDueDate,
      }))
      const evidence: NewEvidenceLink[] = eligible.map((row) => ({
        id: crypto.randomUUID(),
        firmId,
        obligationInstanceId: row.obligationId,
        aiOutputId: null,
        sourceType: 'pulse_apply',
        sourceId: alert.pulseId,
        sourceUrl: alert.sourceUrl,
        verbatimQuote: alert.verbatimQuote,
        rawValue: toDateOnly(row.currentDueDate),
        normalizedValue: toDateOnly(alert.parsedNewDueDate),
        confidence: alert.confidence,
        model: null,
        matrixVersion: null,
        verifiedAt: alert.reviewedAt,
        verifiedBy: alert.reviewedBy,
        appliedAt: now,
        appliedBy: input.userId,
      }))
      const audits: NewAuditEvent[] = eligible.map((row, index) => ({
        id: crypto.randomUUID(),
        firmId,
        actorId: input.userId,
        entityType: 'pulse_application',
        entityId: applications[index]!.id,
        action: 'pulse.apply',
        beforeJson: {
          obligationId: row.obligationId,
          currentDueDate: toDateOnly(row.currentDueDate),
        },
        afterJson: {
          pulseId: alert.pulseId,
          obligationId: row.obligationId,
          currentDueDate: toDateOnly(alert.parsedNewDueDate),
        },
        reason: null,
        ipHash: null,
        userAgentHash: null,
      }))
      const emailId = crypto.randomUUID()
      const email: NewEmailOutbox = {
        id: emailId,
        firmId,
        externalId: `pulse:${firmId}:${alert.pulseId}:${now.getTime()}`,
        type: 'pulse_digest',
        status: 'pending',
        payloadJson: {
          pulseId: alert.pulseId,
          alertId: alert.alertId,
          source: alert.source,
          sourceUrl: alert.sourceUrl,
          summary: alert.aiSummary,
          appliedAt: now.toISOString(),
          appliedBy: input.userId,
          revertExpiresAt: revertExpiresAt.toISOString(),
          obligations: eligible.map((row) => ({
            obligationId: row.obligationId,
            clientId: row.clientId,
            clientName: row.clientName,
            beforeDueDate: toDateOnly(row.currentDueDate),
            afterDueDate: toDateOnly(alert.parsedNewDueDate),
            taxType: row.taxType,
          })),
        },
      }

      const totalEligibleBefore = detail.affectedClients.filter(
        (row) => row.matchStatus === 'eligible',
      ).length
      const nextStatus: PulseFirmAlertStatus =
        eligible.length < totalEligibleBefore ? 'partially_applied' : 'applied'
      const queries: BatchItem<'sqlite'>[] = []
      for (const row of eligible) {
        queries.push(
          db
            .update(obligationInstance)
            .set({ currentDueDate: alert.parsedNewDueDate })
            .where(
              and(
                eq(obligationInstance.firmId, firmId),
                eq(obligationInstance.id, row.obligationId),
                eq(obligationInstance.currentDueDate, row.currentDueDate),
                notInArray(obligationInstance.status, ['done', 'not_applicable']),
              ),
            ),
        )
      }
      for (const chunk of chunkRows(applications, APPLICATION_BATCH_SIZE)) {
        queries.push(db.insert(pulseApplication).values(chunk))
      }
      for (const chunk of chunkRows(evidence, EVIDENCE_BATCH_SIZE)) {
        queries.push(db.insert(evidenceLink).values(chunk))
      }
      for (const chunk of chunkRows(audits, AUDIT_BATCH_SIZE)) {
        queries.push(db.insert(auditEvent).values(chunk))
      }
      for (const chunk of chunkRows([email], EMAIL_BATCH_SIZE)) {
        queries.push(db.insert(emailOutbox).values(chunk))
      }
      queries.push(
        db
          .update(pulseFirmAlert)
          .set({
            status: nextStatus,
            matchedCount: Math.max(totalEligibleBefore - eligible.length, 0),
          })
          .where(and(eq(pulseFirmAlert.firmId, firmId), eq(pulseFirmAlert.id, input.alertId))),
      )

      await db.batch(toNonEmptyBatch(queries))
      const updatedAlert = await getAlert(input.alertId)
      return {
        alert: toAlert(updatedAlert),
        appliedCount: eligible.length,
        auditIds: audits.map((row) => row.id),
        evidenceIds: evidence.map((row) => row.id),
        applicationIds: applications.map((row) => row.id),
        emailOutboxId: emailId,
        revertExpiresAt,
      }
    },

    async dismiss(input: {
      alertId: string
      userId: string
      now?: Date
    }): Promise<PulseDismissResult> {
      const alert = await getAlert(input.alertId)
      const now = input.now ?? new Date()
      const auditId = crypto.randomUUID()
      await db.batch([
        db
          .update(pulseFirmAlert)
          .set({
            status: 'dismissed',
            dismissedBy: input.userId,
            dismissedAt: now,
          })
          .where(and(eq(pulseFirmAlert.firmId, firmId), eq(pulseFirmAlert.id, input.alertId))),
        db.insert(auditEvent).values({
          id: auditId,
          firmId,
          actorId: input.userId,
          entityType: 'pulse_firm_alert',
          entityId: input.alertId,
          action: 'pulse.reject',
          beforeJson: { status: alert.alertStatus },
          afterJson: { status: 'dismissed', pulseId: alert.pulseId },
          reason: null,
          ipHash: null,
          userAgentHash: null,
        }),
      ])
      const updated = await getAlert(input.alertId)
      return { alert: toAlert(updated), auditId }
    },

    async revert(input: {
      alertId: string
      userId: string
      now?: Date
    }): Promise<PulseRevertResult> {
      const alert = await getAlert(input.alertId)
      const now = input.now ?? new Date()
      const applications = await db
        .select({
          id: pulseApplication.id,
          obligationId: pulseApplication.obligationInstanceId,
          clientId: pulseApplication.clientId,
          appliedAt: pulseApplication.appliedAt,
          beforeDueDate: pulseApplication.beforeDueDate,
          afterDueDate: pulseApplication.afterDueDate,
          currentDueDate: obligationInstance.currentDueDate,
        })
        .from(pulseApplication)
        .innerJoin(
          obligationInstance,
          eq(pulseApplication.obligationInstanceId, obligationInstance.id),
        )
        .where(
          and(
            eq(pulseApplication.firmId, firmId),
            eq(obligationInstance.firmId, firmId),
            eq(pulseApplication.pulseId, alert.pulseId),
            isNull(pulseApplication.revertedAt),
          ),
        )
        .orderBy(asc(pulseApplication.appliedAt))

      if (applications.length === 0) throw new PulseRepoError('no_eligible')
      const firstAppliedAt = applications[0]!.appliedAt
      if (now.getTime() > firstAppliedAt.getTime() + REVERT_WINDOW_MS) {
        throw new PulseRepoError('revert_expired')
      }
      if (applications.some((row) => !sameTimestamp(row.currentDueDate, row.afterDueDate))) {
        throw new PulseRepoError('conflict')
      }

      const evidence: NewEvidenceLink[] = applications.map((row) => ({
        id: crypto.randomUUID(),
        firmId,
        obligationInstanceId: row.obligationId,
        aiOutputId: null,
        sourceType: 'pulse_revert',
        sourceId: alert.pulseId,
        sourceUrl: alert.sourceUrl,
        verbatimQuote: alert.verbatimQuote,
        rawValue: toDateOnly(row.afterDueDate),
        normalizedValue: toDateOnly(row.beforeDueDate),
        confidence: alert.confidence,
        model: null,
        matrixVersion: null,
        verifiedAt: alert.reviewedAt,
        verifiedBy: alert.reviewedBy,
        appliedAt: now,
        appliedBy: input.userId,
      }))
      const audits: NewAuditEvent[] = applications.map((row) => ({
        id: crypto.randomUUID(),
        firmId,
        actorId: input.userId,
        entityType: 'pulse_application',
        entityId: row.id,
        action: 'pulse.revert',
        beforeJson: {
          pulseId: alert.pulseId,
          obligationId: row.obligationId,
          currentDueDate: toDateOnly(row.afterDueDate),
        },
        afterJson: {
          pulseId: alert.pulseId,
          obligationId: row.obligationId,
          currentDueDate: toDateOnly(row.beforeDueDate),
        },
        reason: null,
        ipHash: null,
        userAgentHash: null,
      }))

      const queries: BatchItem<'sqlite'>[] = []
      for (const row of applications) {
        queries.push(
          db
            .update(obligationInstance)
            .set({ currentDueDate: row.beforeDueDate })
            .where(
              and(
                eq(obligationInstance.firmId, firmId),
                eq(obligationInstance.id, row.obligationId),
                eq(obligationInstance.currentDueDate, row.afterDueDate),
              ),
            ),
        )
      }
      queries.push(
        db
          .update(pulseApplication)
          .set({ revertedAt: now, revertedBy: input.userId })
          .where(
            and(
              eq(pulseApplication.firmId, firmId),
              eq(pulseApplication.pulseId, alert.pulseId),
              isNull(pulseApplication.revertedAt),
            ),
          ),
      )
      for (const chunk of chunkRows(evidence, EVIDENCE_BATCH_SIZE)) {
        queries.push(db.insert(evidenceLink).values(chunk))
      }
      for (const chunk of chunkRows(audits, AUDIT_BATCH_SIZE)) {
        queries.push(db.insert(auditEvent).values(chunk))
      }
      queries.push(
        db
          .update(pulseFirmAlert)
          .set({ status: 'reverted' })
          .where(and(eq(pulseFirmAlert.firmId, firmId), eq(pulseFirmAlert.id, input.alertId))),
      )

      await db.batch(toNonEmptyBatch(queries))
      const updated = await getAlert(input.alertId)
      return {
        alert: toAlert(updated),
        revertedCount: applications.length,
        auditIds: audits.map((row) => row.id),
        evidenceIds: evidence.map((row) => row.id),
      }
    },
  }
}

export type PulseRepo = ReturnType<typeof makePulseRepo>
