import { createDb, firmSchema } from '@duedatehq/db'
import { eq } from 'drizzle-orm'
import type { Env } from '../env'
import { enqueueDashboardBriefRefresh } from './dashboard-brief/enqueue'

function localTimeParts(timezone: string, date: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  return { hour, minute }
}

function dateInTimezone(timezone: string, date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

async function enqueueScheduledDashboardBriefs(env: Env, now: Date): Promise<void> {
  const db = createDb(env.DB)
  const firms = await db
    .select({
      id: firmSchema.firmProfile.id,
      timezone: firmSchema.firmProfile.timezone,
    })
    .from(firmSchema.firmProfile)
    .where(eq(firmSchema.firmProfile.status, 'active'))

  await Promise.all(
    firms.map(async (firm) => {
      const { hour, minute } = localTimeParts(firm.timezone, now)
      if (hour !== 7 || minute >= 30) return
      await enqueueDashboardBriefRefresh(env, {
        firmId: firm.id,
        scope: 'firm',
        asOfDate: dateInTimezone(firm.timezone, now),
        reason: 'scheduled',
        bypassDebounce: true,
      })
    }),
  )
}

// Cron Trigger entry — fan out by cron expression in Phase 0.
// Current schedule: */30 * * * * (see wrangler.toml). Drives Pulse ingest + reminders.
export async function scheduled(
  _controller: ScheduledController,
  env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  await enqueueScheduledDashboardBriefs(env, new Date())
}
