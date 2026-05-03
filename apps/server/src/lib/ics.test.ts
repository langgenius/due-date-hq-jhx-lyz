import { describe, expect, it } from 'vitest'
import type {
  CalendarFeedObligationRow,
  CalendarFeedSubscriptionRow,
} from '@duedatehq/ports/calendar'
import { renderCalendarFeed } from './ics'

function subscription(
  over: Partial<CalendarFeedSubscriptionRow> = {},
): CalendarFeedSubscriptionRow {
  return {
    id: 'sub_1',
    firmId: 'firm_1',
    scope: 'my',
    subjectUserId: 'user_1',
    privacyMode: 'redacted',
    tokenNonce: 'nonce_1',
    status: 'active',
    lastAccessedAt: null,
    revokedAt: null,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    firmName: 'Bright CPA',
    firmStatus: 'active',
    firmTimezone: 'America/New_York',
    subjectName: 'Sarah Mitchell',
    subjectEmail: 'sarah@example.com',
    ...over,
  }
}

function obligation(over: Partial<CalendarFeedObligationRow> = {}): CalendarFeedObligationRow {
  return {
    id: 'obl_1',
    clientId: 'client_1',
    clientName: 'Acme, LLC',
    clientState: 'CA',
    clientCounty: 'Orange',
    assigneeName: 'Sarah Mitchell',
    taxType: 'Form 1120-S; Annual',
    taxYear: 2026,
    status: 'pending',
    readiness: 'ready',
    currentDueDate: new Date('2026-04-15T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T12:30:00.000Z'),
    ...over,
  }
}

describe('renderCalendarFeed', () => {
  it('renders stable all-day events with alarms', () => {
    const ics = renderCalendarFeed({
      appUrl: 'https://app.duedatehq.com',
      generatedAt: new Date('2026-05-03T10:00:00.000Z'),
      subscription: subscription(),
      obligations: [obligation()],
    })

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('UID:obligation-obl_1@duedatehq.com')
    expect(ics).toContain('DTSTART;VALUE=DATE:20260415')
    expect(ics).toContain('DTEND;VALUE=DATE:20260416')
    expect(ics).toContain('TRIGGER:-P30D')
    expect(ics).toContain('TRIGGER:-P7D')
    expect(ics).toContain('TRIGGER:-P1D')
  })

  it('redacts client names when privacy mode is redacted', () => {
    const ics = renderCalendarFeed({
      appUrl: 'https://app.duedatehq.com',
      generatedAt: new Date('2026-05-03T10:00:00.000Z'),
      subscription: subscription({ privacyMode: 'redacted' }),
      obligations: [obligation()],
    })

    expect(ics).toContain('SUMMARY:Form 1120-S\\; Annual deadline')
    expect(ics).not.toContain('Acme')
  })

  it('includes and escapes client names when privacy mode is full', () => {
    const ics = renderCalendarFeed({
      appUrl: 'https://app.duedatehq.com',
      generatedAt: new Date('2026-05-03T10:00:00.000Z'),
      subscription: subscription({ privacyMode: 'full' }),
      obligations: [obligation()],
    })

    expect(ics).toContain('SUMMARY:Acme\\, LLC: Form 1120-S\\; Annual deadline')
    expect(ics).toContain('Client: Acme\\, LLC')
  })

  it('keeps empty feeds standards-compliant without adding visible events', () => {
    const ics = renderCalendarFeed({
      appUrl: 'https://app.duedatehq.com',
      generatedAt: new Date('2026-05-03T10:00:00.000Z'),
      subscription: subscription(),
      obligations: [],
    })

    expect(ics).toContain('BEGIN:VFREEBUSY')
    expect(ics).toContain('UID:calendar-subscription-sub_1@duedatehq.com')
    expect(ics).toContain('COMMENT:DueDateHQ calendar feed has no active deadlines')
    expect(ics).not.toContain('BEGIN:VEVENT')
  })
})
