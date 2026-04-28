import { Hono } from 'hono'
import { makeSignature } from 'better-auth/crypto'
import { authSchema, createDb, firmSchema, scoped } from '@duedatehq/db'
import type { ContextVars, Env } from '../env'

type SeedMode = 'empty' | 'workboard'

interface E2ESeedRequest {
  seed?: SeedMode
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
      role: 'owner',
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

    const seeded = seed === 'workboard' ? await seedWorkboard(db, firmId) : { workboardRows: [] }
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
      cookie,
      seeded,
    })
  },
)

async function readSeedRequest(request: Request): Promise<E2ESeedRequest> {
  try {
    const raw = await request.json()
    if (!raw || typeof raw !== 'object') return {}
    const seed = (raw as { seed?: unknown }).seed
    const testId = (raw as { testId?: unknown }).testId
    return {
      seed: seed === 'workboard' ? 'workboard' : 'empty',
      ...(typeof testId === 'string' ? { testId } : {}),
    }
  } catch {
    return {}
  }
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
    entityType: 'llc' as const,
    assigneeName: 'M. Chen',
  }
  const northstar = {
    id: crypto.randomUUID(),
    name: 'Northstar Dental Group',
    ein: '98-7654321',
    state: 'NY',
    entityType: 's_corp' as const,
    assigneeName: 'A. Rivera',
  }
  const copperline = {
    id: crypto.randomUUID(),
    name: 'Copperline Studios',
    ein: '45-1111111',
    state: 'TX',
    entityType: 'c_corp' as const,
    assigneeName: 'K. Patel',
  }
  const clients = [arbor, northstar, copperline]

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
  ])

  return {
    workboardRows: [
      { clientName: arbor.name, status: 'pending' },
      { clientName: northstar.name, status: 'review' },
      { clientName: copperline.name, status: 'waiting_on_client' },
    ],
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
