import { Hono } from 'hono'
import { createDb, makeCalendarFeedRepo } from '@duedatehq/db'
import type {
  CalendarFeedObligationRow,
  CalendarFeedSubscriptionRow,
} from '@duedatehq/ports/calendar'
import type { Env, ContextVars } from '../env'
import { verifyCalendarToken } from '../lib/calendar-token'
import { renderCalendarFeed } from '../lib/ics'

const FEED_LIMIT = 1000
const MS_PER_DAY = 24 * 60 * 60 * 1000

type IcsRouteDeps = {
  now: () => Date
  loadFeed: (
    env: Env,
    token: string,
    now: Date,
  ) => Promise<
    | { status: 'not_found' }
    | { status: 'gone' }
    | {
        status: 'ok'
        subscription: CalendarFeedSubscriptionRow
        obligations: CalendarFeedObligationRow[]
      }
  >
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * MS_PER_DAY)
}

function addMonths(value: Date, months: number): Date {
  const next = new Date(value)
  next.setUTCMonth(next.getUTCMonth() + months)
  return next
}

async function loadCalendarFeed(env: Env, token: string, now: Date) {
  const payload = await verifyCalendarToken({ secret: env.AUTH_SECRET, token })
  if (!payload) return { status: 'not_found' as const }

  const repo = makeCalendarFeedRepo(createDb(env.DB))
  const subscription = await repo.getSubscription(payload.subscriptionId)
  if (!subscription || subscription.tokenNonce !== payload.nonce) {
    return { status: 'not_found' as const }
  }
  if (
    subscription.status !== 'active' ||
    subscription.revokedAt !== null ||
    subscription.firmStatus !== 'active'
  ) {
    return { status: 'gone' as const }
  }

  const obligations = await repo.listFeedObligations(subscription, {
    startDate: addDays(now, -30),
    endDate: addMonths(now, 18),
    limit: FEED_LIMIT,
  })
  await repo.markAccessed(subscription.id, now)
  return { status: 'ok' as const, subscription, obligations }
}

function normalizeCalendarTokenParam(token: string): string {
  return token.endsWith('.ics') ? token.slice(0, -'.ics'.length) : token
}

export function createIcsRoute(
  deps: IcsRouteDeps = {
    now: () => new Date(),
    loadFeed: loadCalendarFeed,
  },
) {
  return new Hono<{
    Bindings: Env
    Variables: ContextVars
  }>().get('/:token', async (c) => {
    const token = normalizeCalendarTokenParam(c.req.param('token'))
    const now = deps.now()
    const result = await deps.loadFeed(c.env, token, now)

    if (result.status === 'not_found') {
      return c.text('Calendar subscription not found.', 404)
    }
    if (result.status === 'gone') {
      return c.text('Calendar subscription is no longer active.', 410)
    }

    const body = renderCalendarFeed({
      appUrl: c.env.APP_URL,
      generatedAt: now,
      subscription: result.subscription,
      obligations: result.obligations,
    })
    return c.body(body, 200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="duedatehq-deadlines.ics"',
      'Cache-Control': 'private, max-age=900',
    })
  })
}

export const icsRoute = createIcsRoute()
