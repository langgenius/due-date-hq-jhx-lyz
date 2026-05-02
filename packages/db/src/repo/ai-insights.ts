import { and, desc, eq, inArray } from 'drizzle-orm'
import type {
  AiInsightCreatePendingInput,
  AiInsightFailedInput,
  AiInsightReadyInput,
  AiInsightRow,
  AiInsightStatus,
} from '@duedatehq/ports/ai-insights'
import type { Db } from '../client'
import { aiInsightCache } from '../schema/ai-insights'

function normalizeInsight(row: typeof aiInsightCache.$inferSelect, now = new Date()): AiInsightRow {
  const computedStatus =
    row.status === 'ready' && row.expiresAt && row.expiresAt.getTime() < now.getTime()
      ? 'stale'
      : row.status
  return {
    id: row.id,
    firmId: row.firmId,
    kind: row.kind,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    asOfDate: row.asOfDate,
    status: computedStatus,
    inputHash: row.inputHash,
    aiOutputId: row.aiOutputId,
    output: row.outputJson ?? null,
    citations: row.citationsJson ?? null,
    reason: row.reason,
    errorCode: row.errorCode,
    generatedAt: row.generatedAt,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function makeAiInsightsRepo(db: Db, firmId: string) {
  async function requireInsight(id: string, now?: Date): Promise<AiInsightRow> {
    const [row] = await db
      .select()
      .from(aiInsightCache)
      .where(and(eq(aiInsightCache.firmId, firmId), eq(aiInsightCache.id, id)))
      .limit(1)
    if (!row) throw new Error('AI insight not found.')
    return normalizeInsight(row, now)
  }

  return {
    firmId,

    async findLatest(input: {
      kind: AiInsightRow['kind']
      subjectType: AiInsightRow['subjectType']
      subjectId: string
      asOfDate: string
      now?: Date
    }): Promise<AiInsightRow | null> {
      const [row] = await db
        .select()
        .from(aiInsightCache)
        .where(
          and(
            eq(aiInsightCache.firmId, firmId),
            eq(aiInsightCache.kind, input.kind),
            eq(aiInsightCache.subjectType, input.subjectType),
            eq(aiInsightCache.subjectId, input.subjectId),
            eq(aiInsightCache.asOfDate, input.asOfDate),
          ),
        )
        .orderBy(desc(aiInsightCache.updatedAt), desc(aiInsightCache.createdAt))
        .limit(1)

      return row ? normalizeInsight(row, input.now) : null
    },

    async findByHash(input: {
      kind: AiInsightRow['kind']
      subjectType: AiInsightRow['subjectType']
      subjectId: string
      asOfDate: string
      inputHash: string
      statuses?: AiInsightStatus[]
      now?: Date
    }): Promise<AiInsightRow | null> {
      const statusPredicate =
        input.statuses && input.statuses.length > 0
          ? inArray(aiInsightCache.status, input.statuses)
          : undefined
      const [row] = await db
        .select()
        .from(aiInsightCache)
        .where(
          and(
            eq(aiInsightCache.firmId, firmId),
            eq(aiInsightCache.kind, input.kind),
            eq(aiInsightCache.subjectType, input.subjectType),
            eq(aiInsightCache.subjectId, input.subjectId),
            eq(aiInsightCache.asOfDate, input.asOfDate),
            eq(aiInsightCache.inputHash, input.inputHash),
            statusPredicate,
          ),
        )
        .orderBy(desc(aiInsightCache.updatedAt), desc(aiInsightCache.createdAt))
        .limit(1)

      return row ? normalizeInsight(row, input.now) : null
    },

    async createPending(input: AiInsightCreatePendingInput): Promise<AiInsightRow> {
      const now = input.now ?? new Date()
      const id = input.id ?? crypto.randomUUID()
      await db.insert(aiInsightCache).values({
        id,
        firmId,
        kind: input.kind,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        asOfDate: input.asOfDate,
        status: 'pending',
        inputHash: input.inputHash,
        outputJson: input.output ?? null,
        citationsJson: input.citations ?? null,
        reason: input.reason,
        generatedAt: input.generatedAt ?? null,
        expiresAt: input.expiresAt ?? null,
        createdAt: now,
        updatedAt: now,
      })
      return requireInsight(id, now)
    },

    async markReady(id: string, input: AiInsightReadyInput): Promise<AiInsightRow> {
      await db
        .update(aiInsightCache)
        .set({
          status: 'ready',
          aiOutputId: input.aiOutputId ?? null,
          outputJson: input.output,
          citationsJson: input.citations ?? null,
          errorCode: null,
          generatedAt: input.generatedAt,
          expiresAt: input.expiresAt,
          updatedAt: input.generatedAt,
        })
        .where(and(eq(aiInsightCache.firmId, firmId), eq(aiInsightCache.id, id)))
      return requireInsight(id, input.generatedAt)
    },

    async markFailed(id: string, input: AiInsightFailedInput): Promise<AiInsightRow> {
      await db
        .update(aiInsightCache)
        .set({
          status: 'failed',
          aiOutputId: input.aiOutputId ?? null,
          errorCode: input.errorCode,
          generatedAt: input.generatedAt,
          expiresAt: input.expiresAt,
          updatedAt: input.generatedAt,
        })
        .where(and(eq(aiInsightCache.firmId, firmId), eq(aiInsightCache.id, id)))
      return requireInsight(id, input.generatedAt)
    },
  }
}

export type AiInsightsRepo = ReturnType<typeof makeAiInsightsRepo>
