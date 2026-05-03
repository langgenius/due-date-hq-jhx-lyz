import type { FirmPublic } from '@duedatehq/contracts'

export function calendarWebcalUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//, 'webcal://')
}

export function canManageFirmCalendar(firm: Pick<FirmPublic, 'role'> | null): boolean {
  return firm?.role === 'owner' || firm?.role === 'manager'
}
