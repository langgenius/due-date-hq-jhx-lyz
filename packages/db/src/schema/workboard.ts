import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { firmProfile } from './firm'

export const WORKBOARD_DENSITIES = ['comfortable', 'compact'] as const
export type WorkboardDensity = (typeof WORKBOARD_DENSITIES)[number]

export const workboardSavedView = sqliteTable(
  'workboard_saved_view',
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
    density: text('density', { enum: WORKBOARD_DENSITIES }).notNull().default('comfortable'),
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
    index('idx_workboard_saved_view_firm_pin_name').on(table.firmId, table.isPinned, table.name),
    index('idx_workboard_saved_view_creator').on(table.firmId, table.createdByUserId),
  ],
)

export const workboardSavedViewRelations = relations(workboardSavedView, ({ one }) => ({
  firm: one(firmProfile, {
    fields: [workboardSavedView.firmId],
    references: [firmProfile.id],
  }),
  creator: one(user, {
    fields: [workboardSavedView.createdByUserId],
    references: [user.id],
  }),
}))

export type WorkboardSavedView = typeof workboardSavedView.$inferSelect
export type NewWorkboardSavedView = typeof workboardSavedView.$inferInsert
