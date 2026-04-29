import { relations, sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { firmProfile } from './firm'
import { obligationInstance } from './obligations'

/**
 * audit_event — append-only compliance log. HARD CONSTRAINT (PRD §13,
 * docs/dev-file/03-Data-Model.md §2.5, docs/dev-file/06 §6.1):
 *
 *   - NO `deleted_at` column.
 *   - NO soft-delete flag.
 *   - Repo layer (packages/db/src/repo/audit.ts) and writer
 *     (packages/db/src/audit-writer.ts) only expose INSERT — UPDATE /
 *     DELETE are physically absent from the repo surface.
 *
 * `action` is a free `text` column on purpose: enum constraints would
 * prevent appending new action strings in Phase 1 without a disruptive
 * migration. Consumers get TypeScript-level safety via the exported union
 * constants below (imported by packages/contracts/src/shared/audit-actions.ts).
 *
 * `before_json` / `after_json` are typed `text({mode:'json'})` — Drizzle
 * serialises transparently; D1 stores as TEXT.
 */
export const auditEvent = sqliteTable(
  'audit_event',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'restrict' }),
    // NULL for system actors (Cron, Queues, webhook handlers).
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),

    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    action: text('action').notNull(),

    beforeJson: text('before_json', { mode: 'json' }).$type<unknown>(),
    afterJson: text('after_json', { mode: 'json' }).$type<unknown>(),
    reason: text('reason'),

    // Anonymised per PRD §9 (SHA-256 of raw value + firm-scoped salt).
    ipHash: text('ip_hash'),
    userAgentHash: text('user_agent_hash'),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    // Audit drawer (PRD §5.5): firm-wide timeline, newest first.
    index('idx_audit_firm_time').on(table.firmId, table.createdAt),
    // "Show me what Actor X did" — Team settings panel + forensic review.
    index('idx_audit_firm_actor_time').on(table.firmId, table.actorId, table.createdAt),
    // "Show me migration.imported events in the last 24h" — Revert surface.
    index('idx_audit_firm_action_time').on(table.firmId, table.action, table.createdAt),
  ],
)

/**
 * evidence_link — the provenance chain backing every AI decision, matrix
 * inference, and user-visible "why this due date?" answer (PRD §5.5).
 *
 * Exactly one of `obligation_instance_id` or `ai_output_id` is set. Demo
 * Sprint does not materialise `ai_output` yet (that belongs to Brief +
 * Pulse); the column is present so the Pulse owner can backfill without
 * touching this schema.
 *
 * `source_type` is `text` (not enum) for the same append-freedom reason as
 * `audit.action`. The TypeScript union below enumerates Demo Sprint values.
 */
export const evidenceLink = sqliteTable(
  'evidence_link',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'restrict' }),

    // XOR with aiOutputId. Not enforced at the DB level because D1 lacks
    // CHECK constraint expressions on nullable FKs; repo layer enforces.
    obligationInstanceId: text('obligation_instance_id').references(() => obligationInstance.id, {
      onDelete: 'set null',
    }),
    aiOutputId: text('ai_output_id'),

    sourceType: text('source_type').notNull(),
    sourceId: text('source_id'),
    sourceUrl: text('source_url'),
    verbatimQuote: text('verbatim_quote'),

    rawValue: text('raw_value'),
    normalizedValue: text('normalized_value'),

    confidence: real('confidence'),
    model: text('model'),
    matrixVersion: text('matrix_version'),

    verifiedAt: integer('verified_at', { mode: 'timestamp_ms' }),
    verifiedBy: text('verified_by').references(() => user.id, { onDelete: 'set null' }),
    appliedAt: integer('applied_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    appliedBy: text('applied_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('idx_evidence_firm_time').on(table.firmId, table.appliedAt),
    index('idx_evidence_oi').on(table.obligationInstanceId),
    index('idx_evidence_source').on(table.sourceType, table.sourceId),
  ],
)

export const auditEventRelations = relations(auditEvent, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [auditEvent.firmId],
    references: [firmProfile.id],
  }),
  actor: one(user, {
    fields: [auditEvent.actorId],
    references: [user.id],
  }),
}))

export const evidenceLinkRelations = relations(evidenceLink, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [evidenceLink.firmId],
    references: [firmProfile.id],
  }),
  obligationInstance: one(obligationInstance, {
    fields: [evidenceLink.obligationInstanceId],
    references: [obligationInstance.id],
  }),
  verifier: one(user, {
    fields: [evidenceLink.verifiedBy],
    references: [user.id],
  }),
  applier: one(user, {
    fields: [evidenceLink.appliedBy],
    references: [user.id],
  }),
}))

export type AuditEvent = typeof auditEvent.$inferSelect
export type NewAuditEvent = typeof auditEvent.$inferInsert
export type EvidenceLink = typeof evidenceLink.$inferSelect
export type NewEvidenceLink = typeof evidenceLink.$inferInsert

/**
 * Compliance audit action strings (docs/dev-file/06-Security-Compliance.md §6.1).
 * Consumers should import from packages/contracts/src/shared/audit-actions.ts;
 * this local copy keeps the DB package standalone.
 */
export const MIGRATION_AUDIT_ACTIONS = [
  'migration.batch.created',
  'migration.imported',
  'migration.reverted',
  'migration.single_undo',
  'migration.mapper.confirmed',
  'migration.normalizer.confirmed',
  'migration.matrix.applied',
] as const
export type MigrationAuditAction = (typeof MIGRATION_AUDIT_ACTIONS)[number]

export const PULSE_AUDIT_ACTIONS = [
  'pulse.ingest',
  'pulse.extract',
  'pulse.approve',
  'pulse.reject',
  'pulse.dismiss',
  'pulse.quarantine',
  'pulse.snooze',
  'pulse.apply',
  'pulse.revert',
] as const
export type PulseAuditAction = (typeof PULSE_AUDIT_ACTIONS)[number]

export const AUDIT_ACTIONS = [...MIGRATION_AUDIT_ACTIONS, ...PULSE_AUDIT_ACTIONS] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/**
 * Evidence source_type strings. AI Mapper / Normalizer write one evidence_link
 * per cell (docs/product-design/migration-copilot/04-ai-prompts.md §2.5 / §3.5);
 * Pulse apply/revert writes provenance for regulatory date changes.
 */
export const EVIDENCE_SOURCE_TYPES = [
  'default_inference_by_entity_state',
  'migration_revert',
  'ai_mapper',
  'ai_normalizer',
  'verified_rule',
  'pulse_apply',
  'pulse_revert',
  'user_override',
] as const
export type EvidenceSourceType = (typeof EVIDENCE_SOURCE_TYPES)[number]
