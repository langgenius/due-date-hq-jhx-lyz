import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { firmProfile } from './firm'

export const CALENDAR_SUBSCRIPTION_SCOPES = ['my', 'firm'] as const
export type CalendarSubscriptionScope = (typeof CALENDAR_SUBSCRIPTION_SCOPES)[number]

export const CALENDAR_PRIVACY_MODES = ['redacted', 'full'] as const
export type CalendarPrivacyMode = (typeof CALENDAR_PRIVACY_MODES)[number]

export const CALENDAR_SUBSCRIPTION_STATUSES = ['active', 'disabled'] as const
export type CalendarSubscriptionStatus = (typeof CALENDAR_SUBSCRIPTION_STATUSES)[number]

export const calendarSubscription = sqliteTable(
  'calendar_subscription',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    scope: text('scope', { enum: CALENDAR_SUBSCRIPTION_SCOPES }).notNull(),
    subjectUserId: text('subject_user_id').references(() => user.id, { onDelete: 'cascade' }),
    privacyMode: text('privacy_mode', { enum: CALENDAR_PRIVACY_MODES })
      .notNull()
      .default('redacted'),
    tokenNonce: text('token_nonce').notNull(),
    status: text('status', { enum: CALENDAR_SUBSCRIPTION_STATUSES }).notNull().default('active'),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp_ms' }),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('uq_calendar_subscription_my')
      .on(table.firmId, table.scope, table.subjectUserId)
      .where(sql`scope = 'my'`),
    uniqueIndex('uq_calendar_subscription_firm')
      .on(table.firmId, table.scope)
      .where(sql`scope = 'firm'`),
    index('idx_calendar_subscription_firm').on(table.firmId, table.status),
    index('idx_calendar_subscription_subject').on(table.subjectUserId),
  ],
)

export const calendarSubscriptionRelations = relations(calendarSubscription, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [calendarSubscription.firmId],
    references: [firmProfile.id],
  }),
  subjectUser: one(user, {
    fields: [calendarSubscription.subjectUserId],
    references: [user.id],
  }),
}))

export type CalendarSubscription = typeof calendarSubscription.$inferSelect
export type NewCalendarSubscription = typeof calendarSubscription.$inferInsert
