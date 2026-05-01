import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { firmProfile } from './firm'

/**
 * client — the CPA firm's tenant-scoped customer record.
 *
 * Layering (docs/dev-file/03-Data-Model.md §2.2):
 *   - Demo Sprint subset only. Coordinator-visible billing mirrors and
 *     readiness_status are deliberately deferred — D1 ALTER TABLE is cheap.
 *   - `firm_id` FK goes to `firm_profile.id` (which === organization.id ===
 *     firmId). Scoped repo factory (`scoped.ts`) is the only way procedures
 *     reach this table.
 *
 * entity_type enum (docs/adr/0011-migration-copilot-demo-sprint-scope.md FU-1):
 *   Expanded from 7 to 8 items to match AI Field Mapper target schema
 *   (`individual` added). See docs/product-design/migration-copilot/04-ai-prompts.md §2.2.
 *
 * `migration_batch_id` is nullable because clients can be created manually
 * (outside of Migration). When non-null, the 24h revert path deletes every
 * client and obligation sharing that batch id in one D1 batch transaction.
 * The schema-level FK is declared from migration.ts to avoid a circular
 * module reference; see docs/dev-file/03-Data-Model.md §2.4.
 */
export const client = sqliteTable(
  'client',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    // EIN regex `^\d{2}-\d{7}$` is enforced in the mapper guard
    // (packages/ai/src/guard.ts) and contract Zod (clients.ts); stored raw so
    // we can diff imported vs normalized values in Evidence drawer.
    ein: text('ein'),
    // 2-letter US state code after Normalizer output. Raw lowercase / full
    // state names are normalized upstream; this column holds the canonical
    // uppercase 2-char code.
    state: text('state'),
    county: text('county'),

    // 8-item enum. Order matches product-design/migration-copilot/04-ai-prompts.md §2.2.
    entityType: text('entity_type', {
      enum: ['llc', 's_corp', 'partnership', 'c_corp', 'sole_prop', 'trust', 'individual', 'other'],
    }).notNull(),

    email: text('email'),
    notes: text('notes'),
    // Team member binding stores auth user.id. `assignee_name` remains a
    // denormalized display/import label so Workboard and migration rows keep
    // working when historical free-text assignments have no member match.
    assigneeId: text('assignee_id'),
    assigneeName: text('assignee_name'),

    // Penalty/exposure inputs. Values come from explicit user input, fixture
    // seed, or migration mapping only; AI never invents dollar amounts.
    estimatedTaxLiabilityCents: integer('estimated_tax_liability_cents'),
    estimatedTaxLiabilitySource: text('estimated_tax_liability_source', {
      enum: ['manual', 'imported', 'demo_seed'],
    }),
    equityOwnerCount: integer('equity_owner_count'),

    // NULL for manually-created clients. Non-null rows participate in the
    // Migration batch revert (24h full revert) / single-client undo (7d).
    migrationBatchId: text('migration_batch_id'),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    // Soft-delete per PRD §8.1; 30d grace then Cron hard-delete cascades
    // to obligation_instance.
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    // Dashboard / Clients page primary listing by firm, newest first.
    index('idx_client_firm_time').on(table.firmId, table.createdAt),
    // Workboard filters by entity_type within firm.
    index('idx_client_firm_entity').on(table.firmId, table.entityType),
    // Workboard P0 filters: state → county drilldown and assignee ownership.
    index('idx_client_firm_state_county').on(table.firmId, table.state, table.county),
    index('idx_client_firm_assignee_id').on(table.firmId, table.assigneeId),
    index('idx_client_firm_assignee').on(table.firmId, table.assigneeName),
    // Dashboard / Workboard penalty input triage.
    index('idx_client_firm_penalty_inputs').on(
      table.firmId,
      table.estimatedTaxLiabilityCents,
      table.equityOwnerCount,
    ),
    // 24h revert path: DELETE FROM client WHERE migration_batch_id = ?
    index('idx_client_batch').on(table.migrationBatchId),
  ],
)

export const clientRelations = relations(client, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [client.firmId],
    references: [firmProfile.id],
  }),
}))

export type Client = typeof client.$inferSelect
export type NewClient = typeof client.$inferInsert

// Exported for the AI Field Mapper contract + runtime guard. Keep this in sync
// with `ClientEntityType` in packages/contracts/src/clients.ts and the Zod
// enum in packages/ai/src/prompts/field-mapper.md.
export const CLIENT_ENTITY_TYPES = [
  'llc',
  's_corp',
  'partnership',
  'c_corp',
  'sole_prop',
  'trust',
  'individual',
  'other',
] as const
export type ClientEntityType = (typeof CLIENT_ENTITY_TYPES)[number]

export const ESTIMATED_TAX_LIABILITY_SOURCES = ['manual', 'imported', 'demo_seed'] as const
export type EstimatedTaxLiabilitySource = (typeof ESTIMATED_TAX_LIABILITY_SOURCES)[number]
