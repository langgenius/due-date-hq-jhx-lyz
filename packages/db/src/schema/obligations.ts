import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { client } from './clients'
import { firmProfile } from './firm'

export const EXPOSURE_STATUSES = ['ready', 'needs_input', 'unsupported'] as const
export type ExposureStatus = (typeof EXPOSURE_STATUSES)[number]

/**
 * obligation_instance — a single due-date row for one client for one tax type.
 *
 * Demo Sprint subset (docs/dev-file/03-Data-Model.md §2.3):
 *   - No `rule_id` FK yet. Demo generates obligations directly from the
 *     Default Matrix v1.0 (tax_type + base_due_date). Phase 1 backfills
 *     `rule_id → obligation_rule.id` + Overlay Engine (exception_rule
 *     join) and `current_due_date` becomes a derived read.
 *   - No `obligation_rule` / `rule_source` / `rule_chunk` tables in Demo;
 *     those are Pulse Pipeline owner's responsibility.
 *
 * Base vs current due date:
 *   - `base_due_date` — the statutory date for this (tax_type, tax_year);
 *     written at create-time and never mutated.
 *   - `current_due_date` — what the Dashboard / Workboard show. Pulse apply
 *     in Demo Sprint directly UPDATEs this value (no overlay); migration
 *     import and manual edits also write here. Phase 1: this column becomes
 *     generated/virtual from base + overlays.
 *
 * status enum: minimal Demo set (PRD §8.1 full set deferred).
 */
export const obligationInstance = sqliteTable(
  'obligation_instance',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),

    // Free text string matching the AI Normalizer tax_types enum
    // (docs/product-design/migration-copilot/05-default-matrix.v1.0.yaml).
    // Phase 1 replaces with rule_id FK.
    taxType: text('tax_type').notNull(),
    // Optional: 4-digit tax year (e.g. '2026'). Some Demo obligations span
    // calendars; NULL means "non-year-specific" which is rare for Demo.
    taxYear: integer('tax_year'),

    baseDueDate: integer('base_due_date', { mode: 'timestamp_ms' }).notNull(),
    currentDueDate: integer('current_due_date', { mode: 'timestamp_ms' }).notNull(),

    status: text('status', {
      enum: ['pending', 'in_progress', 'done', 'waiting_on_client', 'review', 'not_applicable'],
    })
      .notNull()
      .default('pending'),

    // Nullable: rows created outside of a migration batch (manual add,
    // Pulse-apply in Phase 1 via exception) do not carry a batch id.
    migrationBatchId: text('migration_batch_id'),

    estimatedTaxDueCents: integer('estimated_tax_due_cents'),
    estimatedExposureCents: integer('estimated_exposure_cents'),
    exposureStatus: text('exposure_status', { enum: EXPOSURE_STATUSES })
      .notNull()
      .default('needs_input'),
    penaltyBreakdownJson: text('penalty_breakdown_json', { mode: 'json' }).$type<unknown>(),
    penaltyFormulaVersion: text('penalty_formula_version'),
    exposureCalculatedAt: integer('exposure_calculated_at', { mode: 'timestamp_ms' }),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Dashboard tabs: This Week / This Month / All — scan by firm + status +
    // soonest due first.
    index('idx_oi_firm_status_due').on(table.firmId, table.status, table.currentDueDate),
    // Penalty Radar / Workboard triage: sort open obligations by exposure.
    index('idx_oi_firm_due_exposure').on(
      table.firmId,
      table.currentDueDate,
      table.exposureStatus,
      table.estimatedExposureCents,
    ),
    // Workboard P0 filters: tax form/type and dollar-at-risk range.
    index('idx_oi_firm_tax_type_due').on(table.firmId, table.taxType, table.currentDueDate),
    index('idx_oi_firm_exposure_amount').on(table.firmId, table.estimatedExposureCents),
    // Client detail page drawer.
    index('idx_oi_client').on(table.clientId),
    // 24h revert path mirror of idx_client_batch.
    index('idx_oi_batch').on(table.migrationBatchId),
  ],
)

export const obligationInstanceRelations = relations(obligationInstance, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [obligationInstance.firmId],
    references: [firmProfile.id],
  }),
  client: one(client, {
    fields: [obligationInstance.clientId],
    references: [client.id],
  }),
}))

export type ObligationInstance = typeof obligationInstance.$inferSelect
export type NewObligationInstance = typeof obligationInstance.$inferInsert

export const OBLIGATION_STATUSES = [
  'pending',
  'in_progress',
  'done',
  'waiting_on_client',
  'review',
  'not_applicable',
] as const
export type ObligationStatus = (typeof OBLIGATION_STATUSES)[number]
