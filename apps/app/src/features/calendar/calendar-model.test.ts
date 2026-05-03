import { describe, expect, it } from 'vitest'
import {
  appleCalendarSubscriptionUrl,
  calendarWebcalUrl,
  canManageFirmCalendar,
} from './calendar-model'

describe('calendar model', () => {
  it('builds webcal links from http and https feed URLs', () => {
    expect(calendarWebcalUrl('https://app.duedatehq.com/api/ics/token')).toBe(
      'webcal://app.duedatehq.com/api/ics/token',
    )
    expect(calendarWebcalUrl('http://localhost:8787/api/ics/token')).toBe(
      'webcal://localhost:8787/api/ics/token',
    )
  })

  it('only builds Apple Calendar direct-subscribe links for HTTPS feeds', () => {
    expect(appleCalendarSubscriptionUrl('https://app.duedatehq.com/api/ics/token.ics')).toBe(
      'webcal://app.duedatehq.com/api/ics/token.ics',
    )
    expect(appleCalendarSubscriptionUrl('http://localhost:8787/api/ics/token.ics')).toBeNull()
    expect(appleCalendarSubscriptionUrl('not-a-url')).toBeNull()
  })

  it('limits firm calendar management to owner and manager roles', () => {
    expect(canManageFirmCalendar({ role: 'owner' })).toBe(true)
    expect(canManageFirmCalendar({ role: 'manager' })).toBe(true)
    expect(canManageFirmCalendar({ role: 'preparer' })).toBe(false)
    expect(canManageFirmCalendar({ role: 'coordinator' })).toBe(false)
    expect(canManageFirmCalendar(null)).toBe(false)
  })
})
