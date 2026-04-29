import type { DashboardBriefScope } from '@duedatehq/ports'
import type { Env } from '../../env'
import {
  DASHBOARD_BRIEF_MESSAGE_TYPE,
  dashboardBriefIdempotencyKey,
  type DashboardBriefRefreshMessage,
  type DashboardBriefRefreshReason,
} from './message'

const DEBOUNCE_TTL_SECONDS = 5 * 60
const MANUAL_REFRESH_DAILY_LIMIT = 3
const MANUAL_REFRESH_TTL_SECONDS = 36 * 60 * 60

export function dashboardBriefDebounceKey(input: {
  firmId: string
  scope: DashboardBriefScope
  userId?: string | null
}): string {
  return ['dashboard-brief', 'debounce', input.firmId, input.scope, input.userId ?? 'firm'].join(
    ':',
  )
}

function dashboardBriefManualRefreshKey(input: {
  firmId: string
  scope: DashboardBriefScope
  userId?: string | null
  asOfDate?: string | undefined
}): string {
  return [
    'dashboard-brief',
    'manual-refresh',
    input.firmId,
    input.scope,
    input.userId ?? 'firm',
    input.asOfDate ?? 'auto-date',
  ].join(':')
}

async function reserveManualRefresh(
  env: Env,
  input: {
    firmId: string
    scope: DashboardBriefScope
    userId?: string | null
    asOfDate?: string | undefined
  },
): Promise<boolean> {
  const key = dashboardBriefManualRefreshKey(input)
  const current = Number((await env.CACHE.get(key)) ?? '0')
  if (current >= MANUAL_REFRESH_DAILY_LIMIT) return false
  await env.CACHE.put(key, String(current + 1), { expirationTtl: MANUAL_REFRESH_TTL_SECONDS })
  return true
}

export async function enqueueDashboardBriefRefresh(
  env: Env,
  input: {
    firmId: string
    scope?: DashboardBriefScope
    userId?: string | null
    asOfDate?: string
    reason: DashboardBriefRefreshReason
    bypassDebounce?: boolean
  },
): Promise<boolean> {
  const scope = input.scope ?? 'firm'
  const keyInput = {
    firmId: input.firmId,
    scope,
    userId: input.userId ?? null,
    reason: input.reason,
  }
  const idempotencyKey = dashboardBriefIdempotencyKey(
    input.asOfDate ? { ...keyInput, asOfDate: input.asOfDate } : keyInput,
  )
  const debounceKey = dashboardBriefDebounceKey({
    firmId: input.firmId,
    scope,
    userId: input.userId ?? null,
  })

  if (!input.bypassDebounce) {
    const existing = await env.CACHE.get(debounceKey)
    if (existing) return true
    if (
      input.reason === 'manual_refresh' &&
      !(await reserveManualRefresh(env, {
        firmId: input.firmId,
        scope,
        userId: input.userId ?? null,
        asOfDate: input.asOfDate,
      }))
    ) {
      return false
    }
    await env.CACHE.put(debounceKey, '1', { expirationTtl: DEBOUNCE_TTL_SECONDS })
  }

  const message: DashboardBriefRefreshMessage = {
    type: DASHBOARD_BRIEF_MESSAGE_TYPE,
    firmId: input.firmId,
    scope,
    userId: input.userId ?? null,
    reason: input.reason,
    idempotencyKey,
    requestedAt: new Date().toISOString(),
  }
  if (input.asOfDate) message.asOfDate = input.asOfDate

  await env.DASHBOARD_QUEUE.send(message)
  return true
}
