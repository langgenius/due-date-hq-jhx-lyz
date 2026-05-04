import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { firmProfile } from './firm'

export const RULE_REVIEW_DECISION_STATUSES = ['verified', 'rejected'] as const
export type RuleReviewDecisionStatus = (typeof RULE_REVIEW_DECISION_STATUSES)[number]

/**
 * rule_review_decision — firm-scoped ops decisions that promote or reject a
 * source-backed candidate rule. The static rule pack remains the seed of
 * truth; this table stores the reviewed override that the runtime can merge
 * into list/preview/generation paths.
 */
export const ruleReviewDecision = sqliteTable(
  'rule_review_decision',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    ruleId: text('rule_id').notNull(),
    baseVersion: integer('base_version').notNull(),
    status: text('status', { enum: RULE_REVIEW_DECISION_STATUSES }).notNull(),
    ruleJson: text('rule_json', { mode: 'json' }).$type<unknown>(),
    reviewNote: text('review_note'),
    reviewedBy: text('reviewed_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('uq_rule_review_firm_rule').on(table.firmId, table.ruleId),
    index('idx_rule_review_firm_status_time').on(table.firmId, table.status, table.reviewedAt),
    index('idx_rule_review_rule_id').on(table.ruleId),
  ],
)

export const ruleReviewDecisionRelations = relations(ruleReviewDecision, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [ruleReviewDecision.firmId],
    references: [firmProfile.id],
  }),
  reviewer: one(user, {
    fields: [ruleReviewDecision.reviewedBy],
    references: [user.id],
  }),
}))

export type RuleReviewDecision = typeof ruleReviewDecision.$inferSelect
export type NewRuleReviewDecision = typeof ruleReviewDecision.$inferInsert
