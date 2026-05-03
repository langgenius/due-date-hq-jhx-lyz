export type CalendarSubscriptionScope = 'my' | 'firm'
export type CalendarPrivacyMode = 'redacted' | 'full'
export type CalendarSubscriptionStatus = 'active' | 'disabled'

export interface CalendarSubscriptionRow {
  id: string
  firmId: string
  scope: CalendarSubscriptionScope
  subjectUserId: string | null
  privacyMode: CalendarPrivacyMode
  tokenNonce: string
  status: CalendarSubscriptionStatus
  lastAccessedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CalendarUpsertInput {
  scope: CalendarSubscriptionScope
  subjectUserId: string | null
  privacyMode: CalendarPrivacyMode
  tokenNonce: string
}

export interface CalendarFeedSubscriptionRow extends CalendarSubscriptionRow {
  firmName: string
  firmStatus: 'active' | 'suspended' | 'deleted'
  firmTimezone: string
  subjectName: string | null
  subjectEmail: string | null
}

export interface CalendarFeedObligationRow {
  id: string
  clientId: string
  clientName: string
  clientState: string | null
  clientCounty: string | null
  assigneeName: string | null
  taxType: string
  taxYear: number | null
  status: string
  readiness: string
  currentDueDate: Date
  updatedAt: Date
}

export interface CalendarFeedRepo {
  getSubscription(id: string): Promise<CalendarFeedSubscriptionRow | undefined>
  listFeedObligations(
    subscription: CalendarFeedSubscriptionRow,
    input: { startDate: Date; endDate: Date; limit: number },
  ): Promise<CalendarFeedObligationRow[]>
  markAccessed(id: string, accessedAt: Date): Promise<void>
}

export interface CalendarRepo {
  readonly firmId: string
  listForUser(userId: string): Promise<CalendarSubscriptionRow[]>
  upsert(input: CalendarUpsertInput): Promise<CalendarSubscriptionRow>
  find(id: string): Promise<CalendarSubscriptionRow | undefined>
  regenerate(id: string, tokenNonce: string): Promise<CalendarSubscriptionRow | undefined>
  disable(id: string): Promise<CalendarSubscriptionRow | undefined>
}
