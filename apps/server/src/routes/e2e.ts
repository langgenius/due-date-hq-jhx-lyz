import { Hono } from 'hono'
import { makeSignature } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { authSchema, createDb, firmSchema, scoped } from '@duedatehq/db'
import type { ContextVars, Env } from '../env'

type SeedMode = 'empty' | 'workboard' | 'pulse'
type SeedRole = 'owner' | 'coordinator'
type BillingPlan = 'firm' | 'pro'
type BillingStatus = 'active' | 'trialing' | 'past_due' | 'paused'
type BillingInterval = 'month' | 'year'

interface E2ESeedRequest {
  seed?: SeedMode
  role?: SeedRole
  testId?: string
}

const COOKIE_NAME = 'duedatehq.session_token'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const e2eRoute = new Hono<{ Bindings: Env; Variables: ContextVars }>().post(
  '/session',
  async (c) => {
    if (c.env.ENV !== 'development') {
      return c.notFound()
    }

    const input = await readSeedRequest(c.req.raw)
    const seed = input.seed ?? 'empty'
    const role = input.role ?? 'owner'
    const suffix = buildStableSuffix(input.testId)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000)
    const userId = `e2e_user_${suffix}`
    const firmId = `e2e_firm_${suffix}`
    const sessionId = `e2e_session_${suffix}`
    const token = `e2e_token_${suffix}_${crypto.randomUUID().replaceAll('-', '')}`
    const db = createDb(c.env.DB)

    await db.insert(authSchema.user).values({
      id: userId,
      name: 'E2E Owner',
      email: `${suffix}@e2e.duedatehq.test`,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(authSchema.organization).values({
      id: firmId,
      name: 'E2E Practice',
      slug: `e2e-${suffix}`,
      logo: null,
      createdAt: now,
      metadata: null,
    })

    await db.insert(authSchema.member).values({
      id: `e2e_member_${suffix}`,
      organizationId: firmId,
      userId,
      role,
      createdAt: now,
      status: 'active',
    })

    await db.insert(firmSchema.firmProfile).values({
      id: firmId,
      name: 'E2E Practice',
      plan: 'solo',
      seatLimit: 1,
      timezone: 'America/New_York',
      ownerUserId: userId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    await db.insert(authSchema.session).values({
      id: sessionId,
      token,
      userId,
      activeOrganizationId: firmId,
      expiresAt,
      createdAt: now,
      updatedAt: now,
      ipAddress: '127.0.0.1',
      userAgent: 'Playwright E2E',
    })

    const seeded =
      seed === 'pulse'
        ? await seedPulse(db, firmId, userId)
        : seed === 'workboard'
          ? await seedWorkboard(db, firmId)
          : { workboardRows: [] }
    const signedToken = `${token}.${await makeSignature(token, c.env.AUTH_SECRET)}`
    const requestUrl = new URL(c.req.url)
    const cookie = {
      name: COOKIE_NAME,
      value: signedToken,
      domain: requestUrl.hostname,
      path: '/',
      httpOnly: true,
      secure: requestUrl.protocol === 'https:',
      sameSite: 'Lax' as const,
      expires: Math.floor(expiresAt.getTime() / 1000),
    }

    c.header('Set-Cookie', serializeCookie(cookie))
    return c.json({
      user: { id: userId, name: 'E2E Owner', email: `${suffix}@e2e.duedatehq.test` },
      firmId,
      role,
      cookie,
      seeded,
    })
  },
)

e2eRoute.post('/billing/subscription', async (c) => {
  if (c.env.ENV !== 'development') {
    return c.notFound()
  }

  const input = await readBillingRequest(c.req.raw)
  if (!input.firmId) {
    return c.json({ error: 'firmId is required' }, 400)
  }

  const db = createDb(c.env.DB)
  const now = new Date()
  const periodEnd =
    input.interval === 'year'
      ? new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)
  const seatLimit = input.plan === 'firm' ? 10 : 5
  const customerId = `cus_e2e_${input.firmId.replace(/[^a-zA-Z0-9_]/g, '_')}`
  const stripeSubscriptionId = `sub_e2e_${crypto.randomUUID().replaceAll('-', '')}`

  await db
    .update(authSchema.organization)
    .set({ stripeCustomerId: customerId })
    .where(eq(authSchema.organization.id, input.firmId))

  await db
    .update(firmSchema.firmProfile)
    .set({
      plan: input.plan,
      seatLimit,
      billingCustomerId: customerId,
      billingSubscriptionId: stripeSubscriptionId,
      updatedAt: now,
    })
    .where(eq(firmSchema.firmProfile.id, input.firmId))

  const subscription = {
    id: `e2e_subscription_${crypto.randomUUID().replaceAll('-', '')}`,
    plan: input.plan,
    referenceId: input.firmId,
    stripeCustomerId: customerId,
    stripeSubscriptionId,
    status: input.status,
    periodStart: now,
    periodEnd,
    seats: seatLimit,
    billingInterval: input.interval,
    trialStart: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    cancelAt: null,
    canceledAt: null,
    endedAt: null,
    stripeScheduleId: null,
    createdAt: now,
    updatedAt: now,
  }
  await db.insert(authSchema.subscription).values(subscription)

  return c.json({
    subscription: {
      ...subscription,
      periodStart: subscription.periodStart.toISOString(),
      periodEnd: subscription.periodEnd.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    },
    firm: {
      id: input.firmId,
      plan: input.plan,
      seatLimit,
      billingCustomerId: customerId,
      billingSubscriptionId: stripeSubscriptionId,
    },
  })
})

async function readSeedRequest(request: Request): Promise<E2ESeedRequest> {
  try {
    const raw = await request.json()
    if (!raw || typeof raw !== 'object') return {}
    const seed = (raw as { seed?: unknown }).seed
    const role = (raw as { role?: unknown }).role
    const testId = (raw as { testId?: unknown }).testId
    return {
      seed: seed === 'pulse' || seed === 'workboard' ? seed : 'empty',
      role: role === 'coordinator' ? 'coordinator' : 'owner',
      ...(typeof testId === 'string' ? { testId } : {}),
    }
  } catch {
    return {}
  }
}

async function readBillingRequest(request: Request): Promise<{
  firmId: string | null
  plan: BillingPlan
  status: BillingStatus
  interval: BillingInterval
}> {
  try {
    const raw: unknown = await request.json()
    if (!raw || typeof raw !== 'object') {
      return { firmId: null, plan: 'pro', status: 'active', interval: 'month' }
    }
    const input = raw as {
      firmId?: unknown
      plan?: unknown
      status?: unknown
      interval?: unknown
    }
    return {
      firmId: typeof input.firmId === 'string' ? input.firmId : null,
      plan: input.plan === 'firm' ? 'firm' : 'pro',
      status: isBillingStatus(input.status) ? input.status : 'active',
      interval: input.interval === 'year' ? 'year' : 'month',
    }
  } catch {
    return { firmId: null, plan: 'pro', status: 'active', interval: 'month' }
  }
}

function isBillingStatus(value: unknown): value is BillingStatus {
  return value === 'active' || value === 'trialing' || value === 'past_due' || value === 'paused'
}

function buildStableSuffix(value: string | undefined): string {
  const titleSlug = (value ?? 'session')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 44)
  const randomSlug = crypto.randomUUID().replaceAll('-', '').slice(0, 16)
  return `${titleSlug || 'session'}_${randomSlug}`
}

async function seedWorkboard(db: ReturnType<typeof createDb>, firmId: string) {
  const repo = scoped(db, firmId)
  const arbor = {
    id: crypto.randomUUID(),
    name: 'Arbor & Vale LLC',
    ein: '12-3456789',
    state: 'CA',
    county: 'Los Angeles',
    entityType: 'llc' as const,
    assigneeName: 'M. Chen',
  }
  const northstar = {
    id: crypto.randomUUID(),
    name: 'Northstar Dental Group',
    ein: '98-7654321',
    state: 'NY',
    county: 'Queens',
    entityType: 's_corp' as const,
    assigneeName: 'A. Rivera',
  }
  const copperline = {
    id: crypto.randomUUID(),
    name: 'Copperline Studios',
    ein: '45-1111111',
    state: 'TX',
    county: 'Travis',
    entityType: 'c_corp' as const,
    assigneeName: 'K. Patel',
  }
  const foundry = {
    id: crypto.randomUUID(),
    name: 'Unassigned Foundry LLC',
    ein: '37-2222222',
    state: 'CA',
    county: 'San Diego',
    entityType: 'llc' as const,
    assigneeName: null,
  }
  const clients = [arbor, northstar, copperline, foundry]

  await repo.clients.createBatch(clients)
  await repo.obligations.createBatch([
    {
      id: crypto.randomUUID(),
      clientId: arbor.id,
      taxType: 'federal_1065',
      taxYear: 2026,
      baseDueDate: new Date('2026-03-15T00:00:00.000Z'),
      currentDueDate: new Date('2026-03-15T00:00:00.000Z'),
      status: 'pending',
      migrationBatchId: null,
    },
    {
      id: crypto.randomUUID(),
      clientId: northstar.id,
      taxType: 'ny_ct3s',
      taxYear: 2026,
      baseDueDate: new Date('2026-03-18T00:00:00.000Z'),
      currentDueDate: new Date('2026-03-18T00:00:00.000Z'),
      status: 'review',
      migrationBatchId: null,
    },
    {
      id: crypto.randomUUID(),
      clientId: copperline.id,
      taxType: 'tx_franchise_report',
      taxYear: 2026,
      baseDueDate: new Date('2026-04-02T00:00:00.000Z'),
      currentDueDate: new Date('2026-04-02T00:00:00.000Z'),
      status: 'waiting_on_client',
      migrationBatchId: null,
    },
    {
      id: crypto.randomUUID(),
      clientId: foundry.id,
      taxType: 'ca_568',
      taxYear: 2026,
      baseDueDate: new Date('2026-05-02T00:00:00.000Z'),
      currentDueDate: new Date('2026-05-02T00:00:00.000Z'),
      status: 'pending',
      migrationBatchId: null,
    },
  ])

  return {
    workboardRows: [
      { clientName: arbor.name, status: 'pending' },
      { clientName: northstar.name, status: 'review' },
      { clientName: copperline.name, status: 'waiting_on_client' },
      { clientName: foundry.name, status: 'pending' },
    ],
  }
}

async function seedPulse(db: ReturnType<typeof createDb>, firmId: string, userId: string) {
  const repo = scoped(db, firmId)
  const originalDueDate = new Date('2026-03-15T00:00:00.000Z')
  const newDueDate = new Date('2026-10-15T00:00:00.000Z')
  const publishedAt = new Date('2026-04-15T17:00:00.000Z')
  const reviewedAt = new Date('2026-04-15T18:00:00.000Z')
  const arbor = {
    id: crypto.randomUUID(),
    name: 'Arbor & Vale LLC',
    ein: '12-3456789',
    state: 'CA',
    county: 'Los Angeles',
    entityType: 'llc' as const,
    assigneeName: 'M. Chen',
  }
  const bright = {
    id: crypto.randomUUID(),
    name: 'Bright Studio S-Corp',
    ein: '21-2222222',
    state: 'CA',
    county: null,
    entityType: 's_corp' as const,
    assigneeName: 'A. Rivera',
  }
  const northstar = {
    id: crypto.randomUUID(),
    name: 'Northstar Dental Group',
    ein: '98-7654321',
    state: 'NY',
    county: 'Queens',
    entityType: 's_corp' as const,
    assigneeName: 'A. Rivera',
  }

  await repo.clients.createBatch([arbor, bright, northstar])
  await repo.obligations.createBatch([
    {
      id: crypto.randomUUID(),
      clientId: arbor.id,
      taxType: 'federal_1065',
      taxYear: 2026,
      baseDueDate: originalDueDate,
      currentDueDate: originalDueDate,
      status: 'pending',
      migrationBatchId: null,
    },
    {
      id: crypto.randomUUID(),
      clientId: bright.id,
      taxType: 'federal_1120s',
      taxYear: 2026,
      baseDueDate: originalDueDate,
      currentDueDate: originalDueDate,
      status: 'review',
      migrationBatchId: null,
    },
    {
      id: crypto.randomUUID(),
      clientId: northstar.id,
      taxType: 'ny_ct3s',
      taxYear: 2026,
      baseDueDate: new Date('2026-03-18T00:00:00.000Z'),
      currentDueDate: new Date('2026-03-18T00:00:00.000Z'),
      status: 'pending',
      migrationBatchId: null,
    },
  ])

  const seededPulse = await repo.pulse.createSeedAlert({
    source: 'IRS Disaster Relief',
    sourceUrl: 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations',
    rawR2Key: 'demo/pulse/irs-ca-storm-relief.html',
    publishedAt,
    aiSummary: 'IRS CA storm relief extends selected filing deadlines for Los Angeles County.',
    verbatimQuote:
      'Individuals and businesses in Los Angeles County have until October 15, 2026 to file various federal returns.',
    parsedJurisdiction: 'CA',
    parsedCounties: ['Los Angeles'],
    parsedForms: ['federal_1065', 'federal_1120s'],
    parsedEntityTypes: ['llc', 's_corp'],
    parsedOriginalDueDate: originalDueDate,
    parsedNewDueDate: newDueDate,
    parsedEffectiveFrom: publishedAt,
    confidence: 0.94,
    reviewedBy: userId,
    reviewedAt,
    requiresHumanReview: true,
    isSample: true,
  })

  return {
    workboardRows: [
      { clientName: arbor.name, status: 'pending' },
      { clientName: bright.name, status: 'review' },
      { clientName: northstar.name, status: 'pending' },
    ],
    pulseAlerts: [{ alertId: seededPulse.alertId, pulseId: seededPulse.pulseId }],
  }
}

function serializeCookie(cookie: {
  name: string
  value: string
  path: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'Lax'
  expires: number
}) {
  const parts = [
    `${cookie.name}=${cookie.value}`,
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    `Expires=${new Date(cookie.expires * 1000).toUTCString()}`,
    `Path=${cookie.path}`,
    `SameSite=${cookie.sameSite}`,
  ]
  if (cookie.httpOnly) parts.push('HttpOnly')
  if (cookie.secure) parts.push('Secure')
  return parts.join('; ')
}
