import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { firmProfile } from './firm'

export const EMAIL_OUTBOX_STATUSES = ['pending', 'sending', 'sent', 'failed'] as const
export type EmailOutboxStatus = (typeof EMAIL_OUTBOX_STATUSES)[number]

export const EMAIL_OUTBOX_TYPES = ['pulse_digest'] as const
export type EmailOutboxType = (typeof EMAIL_OUTBOX_TYPES)[number]

/**
 * email_outbox — transactional notification jobs.
 *
 * Pulse Apply writes a pending digest row in the same D1 batch as due-date
 * changes, evidence, audit, and pulse_application rows. Queue flushing is a
 * separate notification slice.
 */
export const emailOutbox = sqliteTable(
  'email_outbox',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    externalId: text('external_id').notNull(),
    type: text('type', { enum: EMAIL_OUTBOX_TYPES }).notNull(),
    status: text('status', { enum: EMAIL_OUTBOX_STATUSES }).notNull().default('pending'),
    payloadJson: text('payload_json', { mode: 'json' }).$type<unknown>().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
    failedAt: integer('failed_at', { mode: 'timestamp_ms' }),
    failureReason: text('failure_reason'),
  },
  (table) => [
    uniqueIndex('uq_email_outbox_external_id').on(table.externalId),
    index('idx_outbox_status').on(table.status, table.createdAt),
    index('idx_outbox_firm_time').on(table.firmId, table.createdAt),
  ],
)

export const emailOutboxRelations = relations(emailOutbox, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [emailOutbox.firmId],
    references: [firmProfile.id],
  }),
}))

export type EmailOutbox = typeof emailOutbox.$inferSelect
export type NewEmailOutbox = typeof emailOutbox.$inferInsert
