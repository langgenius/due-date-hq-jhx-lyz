import type { InAppNotificationPublic, NotificationPreferencePublic } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { requireCurrentFirmRole } from '../_permissions'
import { os } from '../_root'

type NotificationRow = Omit<InAppNotificationPublic, 'readAt' | 'createdAt'> & {
  readAt: Date | null
  createdAt: Date
}

function toNotificationPublic(row: NotificationRow): InAppNotificationPublic {
  return {
    ...row,
    metadataJson: row.metadataJson ?? null,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

function toPreferencePublic(row: NotificationPreferencePublic): NotificationPreferencePublic {
  return {
    emailEnabled: row.emailEnabled,
    inAppEnabled: row.inAppEnabled,
    remindersEnabled: row.remindersEnabled,
    pulseEnabled: row.pulseEnabled,
    unassignedRemindersEnabled: row.unassignedRemindersEnabled,
  }
}

function requireNotificationsRepo(scoped: ReturnType<typeof requireTenant>['scoped']) {
  if (!scoped.notifications) {
    throw new Error('Notifications repo methods are not available.')
  }
  return scoped.notifications
}

const list = os.notifications.list.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped, userId } = requireTenant(context)
  const notifications = requireNotificationsRepo(scoped)
  const result = await notifications.listForUser(userId, {
    ...(input?.status !== undefined ? { status: input.status } : {}),
    ...(input?.type !== undefined ? { type: input.type } : {}),
    ...(input?.cursor !== undefined ? { cursor: input.cursor } : {}),
    ...(input?.limit !== undefined ? { limit: input.limit } : {}),
  })
  return {
    notifications: result.rows.map(toNotificationPublic),
    nextCursor: result.nextCursor,
  }
})

const unreadCount = os.notifications.unreadCount.handler(async ({ context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped, userId } = requireTenant(context)
  const notifications = requireNotificationsRepo(scoped)
  return { count: await notifications.unreadCount(userId) }
})

const markRead = os.notifications.markRead.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped, userId } = requireTenant(context)
  const notifications = requireNotificationsRepo(scoped)
  await notifications.markRead(userId, input.id)
  return { ok: true as const }
})

const markAllRead = os.notifications.markAllRead.handler(async ({ context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped, userId } = requireTenant(context)
  const notifications = requireNotificationsRepo(scoped)
  return { count: await notifications.markAllRead(userId) }
})

const getPreferences = os.notifications.getPreferences.handler(async ({ context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped, userId } = requireTenant(context)
  const notifications = requireNotificationsRepo(scoped)
  return toPreferencePublic(await notifications.getPreference(userId))
})

const updatePreferences = os.notifications.updatePreferences.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped, userId } = requireTenant(context)
  const notifications = requireNotificationsRepo(scoped)
  return toPreferencePublic(
    await notifications.updatePreference(userId, {
      ...(input.emailEnabled !== undefined ? { emailEnabled: input.emailEnabled } : {}),
      ...(input.inAppEnabled !== undefined ? { inAppEnabled: input.inAppEnabled } : {}),
      ...(input.remindersEnabled !== undefined ? { remindersEnabled: input.remindersEnabled } : {}),
      ...(input.pulseEnabled !== undefined ? { pulseEnabled: input.pulseEnabled } : {}),
      ...(input.unassignedRemindersEnabled !== undefined
        ? { unassignedRemindersEnabled: input.unassignedRemindersEnabled }
        : {}),
    }),
  )
})

export const notificationsHandlers = {
  list,
  unreadCount,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
}
