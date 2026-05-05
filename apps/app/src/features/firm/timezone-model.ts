import { US_FIRM_TIMEZONES, type USFirmTimezone } from '@duedatehq/contracts'

export const DEFAULT_US_FIRM_TIMEZONE = 'America/New_York' satisfies USFirmTimezone

export function isUSFirmTimezone(value: string): value is USFirmTimezone {
  return (US_FIRM_TIMEZONES as readonly string[]).includes(value)
}

export function resolveUSFirmTimezone(value: string | null | undefined): USFirmTimezone {
  return value && isUSFirmTimezone(value) ? value : DEFAULT_US_FIRM_TIMEZONE
}
