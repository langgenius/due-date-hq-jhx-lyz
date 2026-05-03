import type { FirmPublic } from '@duedatehq/contracts'
import { hasFirmPermission } from '@duedatehq/core/permissions'

export function calendarWebcalUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//, 'webcal://')
}

export function appleCalendarSubscriptionUrl(feedUrl: string): string | null {
  try {
    const url = new URL(feedUrl)
    if (url.protocol !== 'https:') return null
    return calendarWebcalUrl(url.toString())
  } catch {
    return null
  }
}

export function canManageFirmCalendar(
  firm: (Pick<FirmPublic, 'role'> & Partial<Pick<FirmPublic, 'coordinatorCanSeeDollars'>>) | null,
): boolean {
  return hasFirmPermission({
    role: firm?.role,
    permission: 'firm.calendar.manage',
    coordinatorCanSeeDollars: firm?.coordinatorCanSeeDollars,
  })
}
