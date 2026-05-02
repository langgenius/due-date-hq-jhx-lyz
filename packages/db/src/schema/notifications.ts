import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { firmProfile } from './firm'
import { client } from './clients'
import { obligationInstance } from './obligations'

export const EMAIL_OUTBOX_STATUSES = ['pending', 'sending', 'sent', 'failed'] as const
export type EmailOutboxStatus = (typeof EMAIL_OUTBOX_STATUSES)[number]

export const EMAIL_OUTBOX_TYPES = [
  'pulse_digest',
  'deadline_reminder',
  'client_deadline_reminder',
  'audit_evidence_package_ready',
] as const
export type EmailOutboxType = (typeof EMAIL_OUTBOX_TYPES)[number]

export const IN_APP_NOTIFICATION_TYPES = [
  'deadline_reminder',
  'overdue',
  'client_reminder',
  'pulse_alert',
  'audit_package_ready',
  'system',
] as const
export type InAppNotificationType = (typeof IN_APP_NOTIFICATION_TYPES)[number]

export const REMINDER_RECIPIENT_KINDS = ['member', 'client'] as const
export type ReminderRecipientKind = (typeof REMINDER_RECIPIENT_KINDS)[number]

export const REMINDER_CHANNELS = ['email', 'in_app'] as const
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number]

export const REMINDER_STATUSES = ['pending', 'queued', 'sent', 'skipped', 'failed'] as const
export type ReminderStatus = (typeof REMINDER_STATUSES)[number]

export const CLIENT_EMAIL_SUPPRESSION_REASONS = ['unsubscribe', 'bounce', 'manual'] as const
export type ClientEmailSuppressionReason = (typeof CLIENT_EMAIL_SUPPRESSION_REASONS)[number]

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

export const inAppNotification = sqliteTable(
  'in_app_notification',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type', { enum: IN_APP_NOTIFICATION_TYPES }).notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    href: text('href'),
    metadataJson: text('metadata_json', { mode: 'json' }).$type<unknown>(),
    readAt: integer('read_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('idx_in_app_notification_user_time').on(table.firmId, table.userId, table.createdAt),
    index('idx_in_app_notification_user_read').on(table.firmId, table.userId, table.readAt),
  ],
)

export const reminder = sqliteTable(
  'reminder',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    obligationInstanceId: text('obligation_instance_id')
      .notNull()
      .references(() => obligationInstance.id, { onDelete: 'cascade' }),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    recipientKind: text('recipient_kind', { enum: REMINDER_RECIPIENT_KINDS }).notNull(),
    recipientUserId: text('recipient_user_id').references(() => user.id, { onDelete: 'set null' }),
    recipientEmail: text('recipient_email'),
    channel: text('channel', { enum: REMINDER_CHANNELS }).notNull(),
    offsetDays: integer('offset_days').notNull(),
    scheduledFor: text('scheduled_for').notNull(),
    status: text('status', { enum: REMINDER_STATUSES }).notNull().default('pending'),
    emailOutboxId: text('email_outbox_id').references(() => emailOutbox.id, {
      onDelete: 'set null',
    }),
    notificationId: text('notification_id').references(() => inAppNotification.id, {
      onDelete: 'set null',
    }),
    dedupeKey: text('dedupe_key').notNull(),
    sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
    clickedAt: integer('clicked_at', { mode: 'timestamp_ms' }),
    failureReason: text('failure_reason'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('uq_reminder_dedupe').on(table.dedupeKey),
    index('idx_reminder_firm_status_time').on(table.firmId, table.status, table.scheduledFor),
    index('idx_reminder_obligation').on(table.obligationInstanceId),
  ],
)

export const notificationPreference = sqliteTable(
  'notification_preference',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    emailEnabled: integer('email_enabled', { mode: 'boolean' }).notNull().default(true),
    inAppEnabled: integer('in_app_enabled', { mode: 'boolean' }).notNull().default(true),
    remindersEnabled: integer('reminders_enabled', { mode: 'boolean' }).notNull().default(true),
    pulseEnabled: integer('pulse_enabled', { mode: 'boolean' }).notNull().default(true),
    unassignedRemindersEnabled: integer('unassigned_reminders_enabled', { mode: 'boolean' })
      .notNull()
      .default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('uq_notification_preference_firm_user').on(table.firmId, table.userId),
    index('idx_notification_preference_user').on(table.userId),
  ],
)

export const clientEmailSuppression = sqliteTable(
  'client_email_suppression',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull(),
    reason: text('reason', { enum: CLIENT_EMAIL_SUPPRESSION_REASONS }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('uq_client_email_suppression_firm_email').on(table.firmId, table.email),
    uniqueIndex('uq_client_email_suppression_token').on(table.tokenHash),
  ],
)

export const emailOutboxRelations = relations(emailOutbox, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [emailOutbox.firmId],
    references: [firmProfile.id],
  }),
}))

export const inAppNotificationRelations = relations(inAppNotification, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [inAppNotification.firmId],
    references: [firmProfile.id],
  }),
  user: one(user, {
    fields: [inAppNotification.userId],
    references: [user.id],
  }),
}))

export const reminderRelations = relations(reminder, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [reminder.firmId],
    references: [firmProfile.id],
  }),
  obligation: one(obligationInstance, {
    fields: [reminder.obligationInstanceId],
    references: [obligationInstance.id],
  }),
  client: one(client, {
    fields: [reminder.clientId],
    references: [client.id],
  }),
  notification: one(inAppNotification, {
    fields: [reminder.notificationId],
    references: [inAppNotification.id],
  }),
  emailOutbox: one(emailOutbox, {
    fields: [reminder.emailOutboxId],
    references: [emailOutbox.id],
  }),
}))

export type EmailOutbox = typeof emailOutbox.$inferSelect
export type NewEmailOutbox = typeof emailOutbox.$inferInsert
export type InAppNotification = typeof inAppNotification.$inferSelect
export type NewInAppNotification = typeof inAppNotification.$inferInsert
export type Reminder = typeof reminder.$inferSelect
export type NewReminder = typeof reminder.$inferInsert
export type NotificationPreference = typeof notificationPreference.$inferSelect
export type NewNotificationPreference = typeof notificationPreference.$inferInsert
export type ClientEmailSuppression = typeof clientEmailSuppression.$inferSelect
export type NewClientEmailSuppression = typeof clientEmailSuppression.$inferInsert
