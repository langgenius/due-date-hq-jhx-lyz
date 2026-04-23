import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorCodes } from '@duedatehq/contracts/errors'
import type { ContextVars, Env } from '../env'
import { tenantMiddleware } from './tenant'

type TenantTestEnv = Pick<Env, 'DB'>

const testD1: D1Database = {
  prepare(_query) {
    throw new Error('test D1 prepare not implemented')
  },
  batch: async <T = unknown>(_statements: D1PreparedStatement[]): Promise<D1Result<T>[]> => [],
  exec: async (_query) => ({ count: 0, duration: 0 }),
  withSession(_constraintOrBookmark) {
    throw new Error('test D1 session not implemented')
  },
  dump: async () => new ArrayBuffer(0),
}

const testEnv: TenantTestEnv = { DB: testD1 }

const dbMocks = vi.hoisted(() => {
  const limit = vi.fn()
  const where = vi.fn(() => ({ limit }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))
  const fakeDb = { select }
  const createDb = vi.fn(() => fakeDb)
  const scoped = vi.fn((_db, firmId: string) => ({ firmId }))

  return { createDb, limit, scoped }
})

vi.mock('@duedatehq/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@duedatehq/db')>()

  return {
    ...actual,
    createDb: dbMocks.createDb,
    scoped: dbMocks.scoped,
  }
})

function createTestApp(vars: Pick<ContextVars, 'firmId' | 'userId'> = {}) {
  const app = new Hono<{ Bindings: TenantTestEnv; Variables: ContextVars }>()

  app.use('/rpc/*', async (c, next) => {
    if (vars.firmId) {
      c.set('firmId', vars.firmId)
    }
    if (vars.userId) {
      c.set('userId', vars.userId)
    }
    await next()
  })
  app.use('/rpc/*', tenantMiddleware)
  app.get('/rpc/test', (c) => c.json({ scopedFirmId: c.get('scoped')?.firmId }))

  return app
}

describe('tenantMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects RPC requests without an active firm', async () => {
    const response = await createTestApp({ userId: 'user_123' }).request('/rpc/test', {}, testEnv)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: ErrorCodes.TENANT_MISSING })
    expect(dbMocks.createDb).not.toHaveBeenCalled()
  })

  it('rejects RPC requests without an authenticated user id', async () => {
    const response = await createTestApp({ firmId: 'firm_123' }).request('/rpc/test', {}, testEnv)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'UNAUTHORIZED' })
    expect(dbMocks.createDb).not.toHaveBeenCalled()
  })

  it('rejects RPC requests when the active firm is not a user membership', async () => {
    dbMocks.limit.mockResolvedValueOnce([])

    const response = await createTestApp({ firmId: 'firm_123', userId: 'user_123' }).request(
      '/rpc/test',
      {},
      testEnv,
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: ErrorCodes.TENANT_MISMATCH })
    expect(dbMocks.scoped).not.toHaveBeenCalled()
  })

  it('rejects RPC requests for inactive firm memberships', async () => {
    dbMocks.limit.mockResolvedValueOnce([{ status: 'suspended' }])

    const response = await createTestApp({ firmId: 'firm_123', userId: 'user_123' }).request(
      '/rpc/test',
      {},
      testEnv,
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'FORBIDDEN' })
    expect(dbMocks.scoped).not.toHaveBeenCalled()
  })

  it('injects a scoped repo for active firm memberships', async () => {
    dbMocks.limit.mockResolvedValueOnce([{ status: 'active' }])

    const response = await createTestApp({ firmId: 'firm_123', userId: 'user_123' }).request(
      '/rpc/test',
      {},
      testEnv,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ scopedFirmId: 'firm_123' })
    expect(dbMocks.scoped).toHaveBeenCalledWith(expect.anything(), 'firm_123')
  })
})
