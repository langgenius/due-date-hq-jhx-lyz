import type { FirmPublic } from '@duedatehq/contracts'

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

export function canManageFirmCalendar(firm: Pick<FirmPublic, 'role'> | null): boolean {
  return firm?.role === 'owner' || firm?.role === 'manager'
}
