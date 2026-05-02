import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { aiOutput } from './ai'
import { firmProfile } from './firm'

export const AI_INSIGHT_KINDS = ['client_risk_summary', 'deadline_tip'] as const
export type AiInsightKind = (typeof AI_INSIGHT_KINDS)[number]

export const AI_INSIGHT_SUBJECT_TYPES = ['client', 'obligation'] as const
export type AiInsightSubjectType = (typeof AI_INSIGHT_SUBJECT_TYPES)[number]

export const AI_INSIGHT_STATUSES = ['pending', 'ready', 'failed', 'stale'] as const
export type AiInsightStatus = (typeof AI_INSIGHT_STATUSES)[number]

export const aiInsightCache = sqliteTable(
  'ai_insight_cache',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: AI_INSIGHT_KINDS }).notNull(),
    subjectType: text('subject_type', { enum: AI_INSIGHT_SUBJECT_TYPES }).notNull(),
    subjectId: text('subject_id').notNull(),
    asOfDate: text('as_of_date').notNull(),
    status: text('status', { enum: AI_INSIGHT_STATUSES }).notNull().default('pending'),
    inputHash: text('input_hash').notNull(),
    aiOutputId: text('ai_output_id').references(() => aiOutput.id, { onDelete: 'set null' }),
    outputJson: text('output_json', { mode: 'json' }).$type<unknown>(),
    citationsJson: text('citations_json', { mode: 'json' }).$type<unknown>(),
    reason: text('reason').notNull(),
    errorCode: text('error_code'),
    generatedAt: integer('generated_at', { mode: 'timestamp_ms' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('idx_ai_insight_subject_time').on(
      table.firmId,
      table.kind,
      table.subjectType,
      table.subjectId,
      table.asOfDate,
      table.updatedAt,
    ),
    uniqueIndex('uq_ai_insight_ready_hash')
      .on(table.firmId, table.kind, table.subjectId, table.asOfDate, table.inputHash)
      .where(sql`status in ('ready', 'pending')`),
  ],
)

export const aiInsightCacheRelations = relations(aiInsightCache, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [aiInsightCache.firmId],
    references: [firmProfile.id],
  }),
  aiOutput: one(aiOutput, {
    fields: [aiInsightCache.aiOutputId],
    references: [aiOutput.id],
  }),
}))

export type AiInsightCache = typeof aiInsightCache.$inferSelect
export type NewAiInsightCache = typeof aiInsightCache.$inferInsert
