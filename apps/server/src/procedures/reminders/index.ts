import type {
  ReminderRecentSend,
  ReminderSuppression,
  ReminderTemplatePublic,
  ReminderUpcomingItem,
} from '@duedatehq/contracts'
import type {
  ReminderRecentSendRow,
  ReminderSuppressionRow,
  ReminderTemplateRow,
} from '@duedatehq/ports/reminders'
import { requireTenant } from '../_context'
import { requireCurrentFirmRole } from '../_permissions'
import { os } from '../_root'

function requireRemindersRepo(scoped: ReturnType<typeof requireTenant>['scoped']) {
  if (!scoped.reminders) {
    throw new Error('Reminders repo methods are not available.')
  }
  return scoped.reminders
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function toTemplatePublic(row: ReminderTemplateRow): ReminderTemplatePublic {
  return {
    ...row,
    lastSentAt: iso(row.lastSentAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

function toUpcomingPublic(row: ReminderUpcomingItem): ReminderUpcomingItem {
  return row
}

function toRecentSendPublic(row: ReminderRecentSendRow): ReminderRecentSend {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    sentAt: iso(row.sentAt),
  }
}

function toSuppressionPublic(row: ReminderSuppressionRow): ReminderSuppression {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
  }
}

const overview = os.reminders.overview.handler(async ({ context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped } = requireTenant(context)
  const reminders = requireRemindersRepo(scoped)
  return reminders.overview()
})

const listTemplates = os.reminders.listTemplates.handler(async ({ context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped } = requireTenant(context)
  const reminders = requireRemindersRepo(scoped)
  return (await reminders.listTemplates()).map(toTemplatePublic)
})

const updateTemplate = os.reminders.updateTemplate.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager'])
  const { scoped } = requireTenant(context)
  const reminders = requireRemindersRepo(scoped)
  return toTemplatePublic(
    await reminders.updateTemplate(input.templateKey, {
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.bodyText !== undefined ? { bodyText: input.bodyText } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    }),
  )
})

const listUpcoming = os.reminders.listUpcoming.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped } = requireTenant(context)
  const reminders = requireRemindersRepo(scoped)
  const listInput = input?.limit === undefined ? {} : { limit: input.limit }
  return {
    reminders: (await reminders.listUpcoming(listInput)).map(toUpcomingPublic),
  }
})

const listRecentSends = os.reminders.listRecentSends.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped } = requireTenant(context)
  const reminders = requireRemindersRepo(scoped)
  const listInput = input?.limit === undefined ? {} : { limit: input.limit }
  return {
    reminders: (await reminders.listRecentSends(listInput)).map(toRecentSendPublic),
  }
})

const listSuppressions = os.reminders.listSuppressions.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, ['owner', 'manager', 'preparer', 'coordinator'])
  const { scoped } = requireTenant(context)
  const reminders = requireRemindersRepo(scoped)
  const listInput = input?.limit === undefined ? {} : { limit: input.limit }
  return {
    suppressions: (await reminders.listSuppressions(listInput)).map(toSuppressionPublic),
  }
})

export const remindersHandlers = {
  overview,
  listTemplates,
  updateTemplate,
  listUpcoming,
  listRecentSends,
  listSuppressions,
}
