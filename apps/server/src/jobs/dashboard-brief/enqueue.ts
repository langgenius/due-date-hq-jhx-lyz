import type { DashboardBriefScope } from '@duedatehq/ports'
import type { Env } from '../../env'
import {
  DASHBOARD_BRIEF_MESSAGE_TYPE,
  dashboardBriefIdempotencyKey,
  type DashboardBriefRefreshMessage,
  type DashboardBriefRefreshReason,
} from './message'

const DEBOUNCE_TTL_SECONDS = 5 * 60

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
  const debounceKey = `${idempotencyKey}:debounce`

  if (!input.bypassDebounce) {
    const existing = await env.CACHE.get(debounceKey)
    if (existing) return false
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
