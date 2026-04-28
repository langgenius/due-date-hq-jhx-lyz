import { relations, sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { client } from './clients'
import { firmProfile } from './firm'
import { obligationInstance } from './obligations'

export const PULSE_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
  'quarantined',
  'source_revoked',
] as const
export type PulseStatus = (typeof PULSE_STATUSES)[number]

export const PULSE_FIRM_ALERT_STATUSES = [
  'matched',
  'dismissed',
  'snoozed',
  'partially_applied',
  'applied',
  'reverted',
] as const
export type PulseFirmAlertStatus = (typeof PULSE_FIRM_ALERT_STATUSES)[number]

/**
 * pulse — global ops-reviewed regulatory announcement.
 *
 * Tenant state lives in pulse_firm_alert / pulse_application. Never infer a
 * firm's applied state from this table's `status`.
 */
export const pulse = sqliteTable(
  'pulse',
  {
    id: text('id').primaryKey(),
    source: text('source').notNull(),
    sourceUrl: text('source_url').notNull(),
    rawR2Key: text('raw_r2_key'),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),

    aiSummary: text('ai_summary').notNull(),
    verbatimQuote: text('verbatim_quote').notNull(),

    parsedJurisdiction: text('parsed_jurisdiction').notNull(),
    parsedCounties: text('parsed_counties', { mode: 'json' }).$type<string[]>().notNull(),
    parsedForms: text('parsed_forms', { mode: 'json' }).$type<string[]>().notNull(),
    parsedEntityTypes: text('parsed_entity_types', { mode: 'json' }).$type<string[]>().notNull(),
    parsedOriginalDueDate: integer('parsed_original_due_date', {
      mode: 'timestamp_ms',
    }).notNull(),
    parsedNewDueDate: integer('parsed_new_due_date', { mode: 'timestamp_ms' }).notNull(),
    parsedEffectiveFrom: integer('parsed_effective_from', { mode: 'timestamp_ms' }),

    confidence: real('confidence').notNull(),
    status: text('status', { enum: PULSE_STATUSES }).notNull().default('pending_review'),
    reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
    requiresHumanReview: integer('requires_human_review', { mode: 'boolean' })
      .notNull()
      .default(true),
    isSample: integer('is_sample', { mode: 'boolean' }).notNull().default(false),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('idx_pulse_status_pub').on(table.status, table.publishedAt),
    index('idx_pulse_jurisdiction_pub').on(table.parsedJurisdiction, table.publishedAt),
  ],
)

export const pulseFirmAlert = sqliteTable(
  'pulse_firm_alert',
  {
    id: text('id').primaryKey(),
    pulseId: text('pulse_id')
      .notNull()
      .references(() => pulse.id, { onDelete: 'cascade' }),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    status: text('status', { enum: PULSE_FIRM_ALERT_STATUSES }).notNull().default('matched'),
    matchedCount: integer('matched_count').notNull().default(0),
    needsReviewCount: integer('needs_review_count').notNull().default(0),
    dismissedBy: text('dismissed_by').references(() => user.id, { onDelete: 'set null' }),
    dismissedAt: integer('dismissed_at', { mode: 'timestamp_ms' }),
    snoozedUntil: integer('snoozed_until', { mode: 'timestamp_ms' }),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('uq_pulse_firm_alert').on(table.firmId, table.pulseId),
    index('idx_pfa_firm_status_time').on(table.firmId, table.status, table.updatedAt),
    index('idx_pfa_pulse').on(table.pulseId),
  ],
)

export const pulseApplication = sqliteTable(
  'pulse_application',
  {
    id: text('id').primaryKey(),
    pulseId: text('pulse_id')
      .notNull()
      .references(() => pulse.id, { onDelete: 'restrict' }),
    obligationInstanceId: text('obligation_instance_id')
      .notNull()
      .references(() => obligationInstance.id, { onDelete: 'restrict' }),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'restrict' }),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    appliedBy: text('applied_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    appliedAt: integer('applied_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    revertedBy: text('reverted_by').references(() => user.id, { onDelete: 'set null' }),
    revertedAt: integer('reverted_at', { mode: 'timestamp_ms' }),
    beforeDueDate: integer('before_due_date', { mode: 'timestamp_ms' }).notNull(),
    afterDueDate: integer('after_due_date', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('uq_pulse_application_obligation').on(
      table.firmId,
      table.pulseId,
      table.obligationInstanceId,
    ),
    index('idx_pa_firm_pulse').on(table.firmId, table.pulseId),
    index('idx_pa_obligation').on(table.obligationInstanceId),
  ],
)

export const pulseRelations = relations(pulse, ({ many, one }) => ({
  firmAlerts: many(pulseFirmAlert),
  applications: many(pulseApplication),
  reviewer: one(user, {
    fields: [pulse.reviewedBy],
    references: [user.id],
  }),
}))

export const pulseFirmAlertRelations = relations(pulseFirmAlert, ({ one }) => ({
  pulse: one(pulse, {
    fields: [pulseFirmAlert.pulseId],
    references: [pulse.id],
  }),
  firm: one(firmProfile, {
    fields: [pulseFirmAlert.firmId],
    references: [firmProfile.id],
  }),
  dismisser: one(user, {
    fields: [pulseFirmAlert.dismissedBy],
    references: [user.id],
  }),
}))

export const pulseApplicationRelations = relations(pulseApplication, ({ one }) => ({
  pulse: one(pulse, {
    fields: [pulseApplication.pulseId],
    references: [pulse.id],
  }),
  obligationInstance: one(obligationInstance, {
    fields: [pulseApplication.obligationInstanceId],
    references: [obligationInstance.id],
  }),
  client: one(client, {
    fields: [pulseApplication.clientId],
    references: [client.id],
  }),
  firm: one(firmProfile, {
    fields: [pulseApplication.firmId],
    references: [firmProfile.id],
  }),
  applier: one(user, {
    fields: [pulseApplication.appliedBy],
    references: [user.id],
  }),
  reverter: one(user, {
    fields: [pulseApplication.revertedBy],
    references: [user.id],
  }),
}))

export type Pulse = typeof pulse.$inferSelect
export type NewPulse = typeof pulse.$inferInsert
export type PulseFirmAlert = typeof pulseFirmAlert.$inferSelect
export type NewPulseFirmAlert = typeof pulseFirmAlert.$inferInsert
export type PulseApplication = typeof pulseApplication.$inferSelect
export type NewPulseApplication = typeof pulseApplication.$inferInsert
