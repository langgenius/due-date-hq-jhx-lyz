import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContextVars, Env } from '../env'
import { sessionMiddleware } from './session'

const authMocks = vi.hoisted(() => {
  const getSession = vi.fn()
  const createWorkerAuth = vi.fn(() => ({ api: { getSession } }))

  return { createWorkerAuth, getSession }
})

vi.mock('../auth', () => ({
  createWorkerAuth: authMocks.createWorkerAuth,
}))

function createTestApp() {
  const app = new Hono<{ Bindings: Env; Variables: ContextVars }>()

  app.use('/rpc/*', sessionMiddleware)
  app.get('/rpc/test', (c) =>
    c.json({
      firmId: c.get('firmId'),
      hasSession: Boolean(c.get('session')),
      userEmail: c.get('user')?.email,
      userId: c.get('userId'),
    }),
  )

  return app
}

describe('sessionMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects RPC requests without a Better Auth session', async () => {
    authMocks.getSession.mockResolvedValueOnce(null)

    const response = await createTestApp().request('/rpc/test')

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'UNAUTHORIZED' })
    expect(authMocks.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) })
  })

  it('injects session, user, userId, and active organization firmId', async () => {
    authMocks.getSession.mockResolvedValueOnce({
      session: {
        activeOrganizationId: 'firm_123',
        id: 'session_123',
      },
      user: {
        email: 'owner@example.com',
        id: 'user_123',
        name: 'Owner',
      },
    })

    const response = await createTestApp().request('/rpc/test')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      firmId: 'firm_123',
      hasSession: true,
      userEmail: 'owner@example.com',
      userId: 'user_123',
    })
  })
})
