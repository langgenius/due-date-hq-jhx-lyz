export type NotificationType =
  | 'deadline_reminder'
  | 'overdue'
  | 'client_reminder'
  | 'pulse_alert'
  | 'audit_package_ready'
  | 'system'

export interface InAppNotificationRow {
  id: string
  firmId: string
  userId: string
  type: NotificationType
  entityType: string
  entityId: string
  title: string
  body: string
  href: string | null
  metadataJson: unknown
  readAt: Date | null
  createdAt: Date
}

export interface NotificationPreferenceRow {
  id: string
  firmId: string
  userId: string
  emailEnabled: boolean
  inAppEnabled: boolean
  remindersEnabled: boolean
  pulseEnabled: boolean
  unassignedRemindersEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationListInput {
  status?: 'unread' | 'read' | 'all'
  type?: NotificationType
  cursor?: string | null
  limit?: number
}

export interface NotificationListResult {
  rows: InAppNotificationRow[]
  nextCursor: string | null
}

export interface NotificationPreferencePatch {
  emailEnabled?: boolean
  inAppEnabled?: boolean
  remindersEnabled?: boolean
  pulseEnabled?: boolean
  unassignedRemindersEnabled?: boolean
}

export interface NotificationsRepo {
  readonly firmId: string
  listForUser(userId: string, input?: NotificationListInput): Promise<NotificationListResult>
  unreadCount(userId: string): Promise<number>
  markRead(userId: string, id: string): Promise<void>
  markAllRead(userId: string): Promise<number>
  getPreference(userId: string): Promise<NotificationPreferenceRow>
  updatePreference(
    userId: string,
    patch: NotificationPreferencePatch,
  ): Promise<NotificationPreferenceRow>
  create(input: {
    userId: string
    type: NotificationType
    entityType: string
    entityId: string
    title: string
    body: string
    href?: string | null
    metadataJson?: unknown
  }): Promise<{ id: string }>
  enqueueEmail(input: {
    externalId: string
    type:
      | 'pulse_digest'
      | 'pulse_review_request'
      | 'deadline_reminder'
      | 'client_deadline_reminder'
      | 'audit_evidence_package_ready'
      | 'readiness_request'
    payloadJson: unknown
  }): Promise<{ id: string; created: boolean }>
}
