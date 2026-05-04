import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '../client'
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
