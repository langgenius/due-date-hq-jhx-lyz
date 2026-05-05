import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { firmProfile } from './firm'
import { obligationInstance } from './obligations'
import { pulse } from './pulse'

export const EXCEPTION_RULE_STATUSES = [
  'candidate',
  'verified',
  'applied',
  'retracted',
  'superseded',
] as const
export type ExceptionRuleStatus = (typeof EXCEPTION_RULE_STATUSES)[number]

export const EXCEPTION_OVERRIDE_TYPES = ['extend_due_date', 'waive_penalty'] as const
export type ExceptionOverrideType = (typeof EXCEPTION_OVERRIDE_TYPES)[number]

/**
 * exception_rule — practice-scoped regulatory exception sourced from Pulse or custom review.
 *
 * `override_value_json` keeps the contract extensible, while `override_due_date`
 * gives D1 read models a cheap typed value for the current Phase 1 due-date
 * overlay path.
 */
export const exceptionRule = sqliteTable(
  'exception_rule',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id').references(() => firmProfile.id, { onDelete: 'cascade' }),
    sourcePulseId: text('source_pulse_id').references(() => pulse.id, { onDelete: 'set null' }),

    jurisdiction: text('jurisdiction').notNull(),
    counties: text('counties', { mode: 'json' }).$type<string[]>().notNull(),
    affectedForms: text('affected_forms', { mode: 'json' }).$type<string[]>().notNull(),
    affectedEntityTypes: text('affected_entity_types', { mode: 'json' })
      .$type<string[]>()
      .notNull(),

    overrideType: text('override_type', { enum: EXCEPTION_OVERRIDE_TYPES }).notNull(),
    overrideValueJson: text('override_value_json', { mode: 'json' }).$type<unknown>().notNull(),
    overrideDueDate: integer('override_due_date', { mode: 'timestamp_ms' }),

    effectiveFrom: integer('effective_from', { mode: 'timestamp_ms' }),
    effectiveUntil: integer('effective_until', { mode: 'timestamp_ms' }),
    status: text('status', { enum: EXCEPTION_RULE_STATUSES }).notNull().default('candidate'),

    sourceUrl: text('source_url'),
    verbatimQuote: text('verbatim_quote'),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('idx_exc_status_effective').on(table.status, table.effectiveFrom, table.effectiveUntil),
    index('idx_exc_firm_status').on(table.firmId, table.status, table.effectiveFrom),
    index('idx_exc_source_pulse').on(table.sourcePulseId),
  ],
)

export const obligationExceptionApplication = sqliteTable(
  'obligation_exception_application',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    obligationInstanceId: text('obligation_instance_id')
      .notNull()
      .references(() => obligationInstance.id, { onDelete: 'restrict' }),
    exceptionRuleId: text('exception_rule_id')
      .notNull()
      .references(() => exceptionRule.id, { onDelete: 'restrict' }),
    appliedAt: integer('applied_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    appliedByUserId: text('applied_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    revertedAt: integer('reverted_at', { mode: 'timestamp_ms' }),
    revertedByUserId: text('reverted_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    uniqueIndex('uq_obligation_exception_application').on(
      table.obligationInstanceId,
      table.exceptionRuleId,
    ),
    index('idx_oea_firm_obligation_active').on(
      table.firmId,
      table.obligationInstanceId,
      table.revertedAt,
    ),
    index('idx_oea_exception').on(table.exceptionRuleId),
  ],
)

export const exceptionRuleRelations = relations(exceptionRule, ({ many, one }) => ({
  firm: one(firmProfile, {
    fields: [exceptionRule.firmId],
    references: [firmProfile.id],
  }),
  sourcePulse: one(pulse, {
    fields: [exceptionRule.sourcePulseId],
    references: [pulse.id],
  }),
  applications: many(obligationExceptionApplication),
}))

export const obligationExceptionApplicationRelations = relations(
  obligationExceptionApplication,
  ({ one }) => ({
    firm: one(firmProfile, {
      fields: [obligationExceptionApplication.firmId],
      references: [firmProfile.id],
    }),
    obligationInstance: one(obligationInstance, {
      fields: [obligationExceptionApplication.obligationInstanceId],
      references: [obligationInstance.id],
    }),
    exceptionRule: one(exceptionRule, {
      fields: [obligationExceptionApplication.exceptionRuleId],
      references: [exceptionRule.id],
    }),
    applier: one(user, {
      fields: [obligationExceptionApplication.appliedByUserId],
      references: [user.id],
    }),
    reverter: one(user, {
      fields: [obligationExceptionApplication.revertedByUserId],
      references: [user.id],
    }),
  }),
)

export type ExceptionRule = typeof exceptionRule.$inferSelect
export type NewExceptionRule = typeof exceptionRule.$inferInsert
export type ObligationExceptionApplication = typeof obligationExceptionApplication.$inferSelect
export type NewObligationExceptionApplication = typeof obligationExceptionApplication.$inferInsert
