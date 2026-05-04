import { and, desc, eq, inArray } from 'drizzle-orm'
import type { TemporaryRuleRow } from '@duedatehq/ports/rules'
import type { Db } from '../client'
import { client } from '../schema/clients'
import { obligationInstance } from '../schema/obligations'
import { exceptionRule, obligationExceptionApplication } from '../schema/overlay'
import { pulse, pulseFirmAlert } from '../schema/pulse'
import {
  ruleReviewDecision,
  type RuleReviewDecision,
  type RuleReviewDecisionStatus,
} from '../schema/rules'

export interface RuleReviewDecisionInput {
  ruleId: string
  baseVersion: number
  status: RuleReviewDecisionStatus
  ruleJson: unknown
  reviewNote: string | null
  reviewedBy: string
  reviewedAt?: Date
}

function normalizeNote(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function latestDate(...values: Array<Date | null | undefined>): Date | null {
  const dates = values.filter((value): value is Date => value instanceof Date)
  if (dates.length === 0) return null
  return dates.reduce((latest, value) => (value.getTime() > latest.getTime() ? value : latest))
}

export function makeRulesRepo(db: Db, firmId: string) {
  return {
    firmId,

    async listDecisions(status?: RuleReviewDecisionStatus): Promise<RuleReviewDecision[]> {
      const filters = [eq(ruleReviewDecision.firmId, firmId)]
      if (status) filters.push(eq(ruleReviewDecision.status, status))
      return db
        .select()
        .from(ruleReviewDecision)
        .where(and(...filters))
        .orderBy(desc(ruleReviewDecision.reviewedAt))
    },

    async listVerified(): Promise<RuleReviewDecision[]> {
      return this.listDecisions('verified')
    },

    async listTemporaryRules(): Promise<TemporaryRuleRow[]> {
      const rows = await db
        .select({
          id: exceptionRule.id,
          alertId: pulseFirmAlert.id,
          sourcePulseId: exceptionRule.sourcePulseId,
          pulseSummary: pulse.aiSummary,
          sourceUrl: exceptionRule.sourceUrl,
          sourceExcerpt: exceptionRule.verbatimQuote,
          jurisdiction: exceptionRule.jurisdiction,
          counties: exceptionRule.counties,
          affectedForms: exceptionRule.affectedForms,
          affectedEntityTypes: exceptionRule.affectedEntityTypes,
          overrideType: exceptionRule.overrideType,
          overrideDueDate: exceptionRule.overrideDueDate,
          effectiveFrom: exceptionRule.effectiveFrom,
          effectiveUntil: exceptionRule.effectiveUntil,
          exceptionStatus: exceptionRule.status,
          exceptionUpdatedAt: exceptionRule.updatedAt,
          applicationId: obligationExceptionApplication.id,
          appliedAt: obligationExceptionApplication.appliedAt,
          revertedAt: obligationExceptionApplication.revertedAt,
          clientName: client.name,
          taxType: obligationInstance.taxType,
        })
        .from(exceptionRule)
        .innerJoin(
          obligationExceptionApplication,
          eq(obligationExceptionApplication.exceptionRuleId, exceptionRule.id),
        )
        .innerJoin(
          obligationInstance,
          eq(obligationExceptionApplication.obligationInstanceId, obligationInstance.id),
        )
        .innerJoin(client, eq(obligationInstance.clientId, client.id))
        .leftJoin(pulse, eq(exceptionRule.sourcePulseId, pulse.id))
        .leftJoin(
          pulseFirmAlert,
          and(
            eq(pulseFirmAlert.firmId, firmId),
            eq(pulseFirmAlert.pulseId, exceptionRule.sourcePulseId),
          ),
        )
        .where(
          and(
            eq(exceptionRule.firmId, firmId),
            eq(obligationExceptionApplication.firmId, firmId),
            eq(obligationInstance.firmId, firmId),
            eq(client.firmId, firmId),
            inArray(exceptionRule.status, ['verified', 'applied', 'retracted']),
          ),
        )
        .orderBy(desc(exceptionRule.updatedAt), desc(obligationExceptionApplication.appliedAt))

      const byRule = new Map<
        string,
        TemporaryRuleRow & { clientNames: string[]; taxTypes: string[] }
      >()

      for (const row of rows) {
        const existing = byRule.get(row.id)
        const status =
          row.exceptionStatus === 'retracted' ? 'retracted' : row.revertedAt ? 'reverted' : 'active'
        if (!existing) {
          byRule.set(row.id, {
            id: row.id,
            alertId: row.alertId,
            sourcePulseId: row.sourcePulseId,
            title: row.pulseSummary ?? `Temporary ${row.jurisdiction} exception`,
            sourceUrl: row.sourceUrl,
            sourceExcerpt: row.sourceExcerpt,
            jurisdiction: row.jurisdiction,
            counties: row.counties,
            affectedForms: row.affectedForms,
            affectedEntityTypes: row.affectedEntityTypes,
            overrideType: row.overrideType,
            overrideDueDate: row.overrideDueDate,
            effectiveFrom: row.effectiveFrom,
            effectiveUntil: row.effectiveUntil,
            status,
            appliedObligationCount: 1,
            activeObligationCount: row.revertedAt ? 0 : 1,
            revertedObligationCount: row.revertedAt ? 1 : 0,
            firstAppliedAt: row.appliedAt,
            lastActivityAt: latestDate(row.revertedAt, row.appliedAt, row.exceptionUpdatedAt)!,
            clientNames: [row.clientName],
            taxTypes: [row.taxType],
          })
          continue
        }

        existing.appliedObligationCount += 1
        if (row.revertedAt) existing.revertedObligationCount += 1
        else existing.activeObligationCount += 1
        existing.status =
          existing.status === 'retracted'
            ? 'retracted'
            : existing.activeObligationCount > 0
              ? 'active'
              : 'reverted'
        existing.firstAppliedAt =
          existing.firstAppliedAt && row.appliedAt.getTime() < existing.firstAppliedAt.getTime()
            ? row.appliedAt
            : existing.firstAppliedAt
        existing.lastActivityAt =
          latestDate(
            existing.lastActivityAt,
            row.revertedAt,
            row.appliedAt,
            row.exceptionUpdatedAt,
          ) ?? existing.lastActivityAt
        if (!existing.clientNames.includes(row.clientName))
          existing.clientNames.push(row.clientName)
        if (!existing.taxTypes.includes(row.taxType)) existing.taxTypes.push(row.taxType)
      }

      return Array.from(byRule.values())
        .map(({ clientNames: _clientNames, taxTypes: _taxTypes, ...row }) => row)
        .toSorted((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
    },

    async getDecision(ruleId: string): Promise<RuleReviewDecision | null> {
      const rows = await db
        .select()
        .from(ruleReviewDecision)
        .where(and(eq(ruleReviewDecision.firmId, firmId), eq(ruleReviewDecision.ruleId, ruleId)))
        .limit(1)
      return rows[0] ?? null
    },

    async upsertDecision(input: RuleReviewDecisionInput): Promise<RuleReviewDecision> {
      const reviewedAt = input.reviewedAt ?? new Date()
      const id = crypto.randomUUID()
      await db
        .insert(ruleReviewDecision)
        .values({
          id,
          firmId,
          ruleId: input.ruleId,
          baseVersion: input.baseVersion,
          status: input.status,
          ruleJson: input.ruleJson,
          reviewNote: normalizeNote(input.reviewNote),
          reviewedBy: input.reviewedBy,
          reviewedAt,
          updatedAt: reviewedAt,
        })
        .onConflictDoUpdate({
          target: [ruleReviewDecision.firmId, ruleReviewDecision.ruleId],
          set: {
            baseVersion: input.baseVersion,
            status: input.status,
            ruleJson: input.ruleJson,
            reviewNote: normalizeNote(input.reviewNote),
            reviewedBy: input.reviewedBy,
            reviewedAt,
            updatedAt: reviewedAt,
          },
        })

      const row = await this.getDecision(input.ruleId)
      if (!row) throw new Error(`Rule review decision was not persisted for ${input.ruleId}`)
      return row
    },
  }
}

export type RulesRepo = ReturnType<typeof makeRulesRepo>
