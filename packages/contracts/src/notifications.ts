import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EntityIdSchema, TenantIdSchema } from './shared/ids'

export const NotificationTypeSchema = z.enum([
  'deadline_reminder',
  'overdue',
  'client_reminder',
  'pulse_alert',
  'audit_package_ready',
  'system',
])
export type NotificationType = z.infer<typeof NotificationTypeSchema>

export const NotificationStatusFilterSchema = z.enum(['unread', 'read', 'all'])

export const InAppNotificationPublicSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  userId: z.string().min(1),
  type: NotificationTypeSchema,
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  href: z.string().nullable(),
  metadataJson: z.unknown().nullable(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})
export type InAppNotificationPublic = z.infer<typeof InAppNotificationPublicSchema>

export const NotificationPreferencePublicSchema = z.object({
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  remindersEnabled: z.boolean(),
  pulseEnabled: z.boolean(),
  unassignedRemindersEnabled: z.boolean(),
})
export type NotificationPreferencePublic = z.infer<typeof NotificationPreferencePublicSchema>

export const NotificationListInputSchema = z
  .object({
    status: NotificationStatusFilterSchema.default('all').optional(),
    type: NotificationTypeSchema.optional(),
    cursor: z.string().nullable().optional(),
    limit: z.number().int().min(1).max(100).default(50).optional(),
  })
  .optional()

export const notificationsContract = oc.router({
  list: oc.input(NotificationListInputSchema).output(
    z.object({
      notifications: z.array(InAppNotificationPublicSchema),
      nextCursor: z.string().nullable(),
    }),
  ),
  unreadCount: oc.input(z.undefined()).output(z.object({ count: z.number().int().min(0) })),
  markRead: oc.input(z.object({ id: EntityIdSchema })).output(z.object({ ok: z.literal(true) })),
  markAllRead: oc.input(z.undefined()).output(z.object({ count: z.number().int().min(0) })),
  getPreferences: oc.input(z.undefined()).output(NotificationPreferencePublicSchema),
  updatePreferences: oc
    .input(NotificationPreferencePublicSchema.partial())
    .output(NotificationPreferencePublicSchema),
})

export type NotificationsContract = typeof notificationsContract
