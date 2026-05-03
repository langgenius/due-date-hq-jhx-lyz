import { describe, expect, it, vi } from 'vitest'
import type {
  CalendarFeedObligationRow,
  CalendarFeedSubscriptionRow,
} from '@duedatehq/ports/calendar'
import { createIcsRoute } from './ics'

function subscription(): CalendarFeedSubscriptionRow {
  return {
    id: 'sub_1',
    firmId: 'firm_1',
    scope: 'firm',
    subjectUserId: null,
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
    subjectName: null,
    subjectEmail: null,
  }
}

function obligation(): CalendarFeedObligationRow {
  return {
    id: 'obl_1',
    clientId: 'client_1',
    clientName: 'Acme LLC',
    clientState: 'CA',
    clientCounty: 'Orange',
    assigneeName: null,
    taxType: 'Form 1120-S',
    taxYear: 2026,
    status: 'pending',
    readiness: 'ready',
    currentDueDate: new Date('2026-04-15T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T12:30:00.000Z'),
  }
}

describe('ics route', () => {
  it('returns 404 for invalid tokens', async () => {
    const route = createIcsRoute({
      now: () => new Date('2026-05-03T10:00:00.000Z'),
      loadFeed: vi.fn(async () => ({ status: 'not_found' as const })),
    })

    const response = await route.request('/bad', {}, { APP_URL: 'https://app.duedatehq.com' })

    expect(response.status).toBe(404)
  })

  it('returns 410 for inactive subscriptions', async () => {
    const route = createIcsRoute({
      now: () => new Date('2026-05-03T10:00:00.000Z'),
      loadFeed: vi.fn(async () => ({ status: 'gone' as const })),
    })

    const response = await route.request('/revoked', {}, { APP_URL: 'https://app.duedatehq.com' })

    expect(response.status).toBe(410)
  })

  it('returns text/calendar for valid subscriptions', async () => {
    const route = createIcsRoute({
      now: () => new Date('2026-05-03T10:00:00.000Z'),
      loadFeed: vi.fn(async () => ({
        status: 'ok' as const,
        subscription: subscription(),
        obligations: [obligation()],
      })),
    })

    const response = await route.request('/valid', {}, { APP_URL: 'https://app.duedatehq.com' })
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/calendar')
    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('UID:obligation-obl_1@duedatehq.com')
  })

  it('accepts the .ics suffix used by calendar clients', async () => {
    const loadFeed = vi.fn(async () => ({
      status: 'ok' as const,
      subscription: subscription(),
      obligations: [obligation()],
    }))
    const route = createIcsRoute({
      now: () => new Date('2026-05-03T10:00:00.000Z'),
      loadFeed,
    })

    const response = await route.request('/valid.ics', {}, { APP_URL: 'https://app.duedatehq.com' })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/calendar')
    expect(response.headers.get('content-disposition')).toContain('duedatehq-deadlines.ics')
    expect(loadFeed).toHaveBeenCalledWith(
      { APP_URL: 'https://app.duedatehq.com' },
      'valid',
      new Date('2026-05-03T10:00:00.000Z'),
    )
  })
})
