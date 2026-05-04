import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { firmProfile } from './firm'

export const OBLIGATION_QUEUE_DENSITIES = ['comfortable', 'compact'] as const
export type ObligationQueueDensity = (typeof OBLIGATION_QUEUE_DENSITIES)[number]

export const obligationSavedView = sqliteTable(
  'obligation_saved_view',
  {
    id: text('id').primaryKey(),
    firmId: text('firm_id')
      .notNull()
      .references(() => firmProfile.id, { onDelete: 'cascade' }),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    queryJson: text('query_json', { mode: 'json' }).$type<unknown>().notNull(),
    columnVisibilityJson: text('column_visibility_json', { mode: 'json' })
      .$type<unknown>()
      .notNull(),
    density: text('density', { enum: OBLIGATION_QUEUE_DENSITIES }).notNull().default('comfortable'),
    isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('idx_obligation_saved_view_firm_pin_name').on(table.firmId, table.isPinned, table.name),
    index('idx_obligation_saved_view_creator').on(table.firmId, table.createdByUserId),
  ],
)

export const obligationSavedViewRelations = relations(obligationSavedView, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [obligationSavedView.firmId],
    references: [firmProfile.id],
  }),
  creator: one(user, {
    fields: [obligationSavedView.createdByUserId],
    references: [user.id],
  }),
}))

export type ObligationQueueSavedView = typeof obligationSavedView.$inferSelect
export type NewObligationQueueSavedView = typeof obligationSavedView.$inferInsert
