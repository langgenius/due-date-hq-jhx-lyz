import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env, ContextVars } from '../env'
import { resendWebhook } from './resend'

type TestEnv = Pick<Env, 'DB' | 'RESEND_API_KEY' | 'RESEND_WEBHOOK_SECRET'>

const { verifyMock, dbMocks } = vi.hoisted(() => {
  const where = vi.fn(async () => undefined)
  const set = vi.fn(() => ({ where }))
  const update = vi.fn(() => ({ set }))
  const createDb = vi.fn(() => ({ update }))
  return {
    verifyMock: vi.fn(),
    dbMocks: {
      createDb,
      update,
      set,
      where,
    },
  }
})

vi.mock('resend', () => ({
  Resend: class {
    webhooks = {
      verify: verifyMock,
    }
  },
}))

vi.mock('@duedatehq/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@duedatehq/db')>()
  return {
    ...actual,
    createDb: dbMocks.createDb,
  }
})

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

function createTestApp() {
  const app = new Hono<{ Bindings: TestEnv; Variables: ContextVars }>()
  app.route('/api/webhook/resend', resendWebhook)
  return app
}

function env(overrides: Partial<TestEnv> = {}): TestEnv {
  return {
    DB: testD1,
    RESEND_WEBHOOK_SECRET: 'whsec_test',
    ...overrides,
  }
}

function signedRequest(body = '{"type":"email.delivered"}') {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'svix-id': 'msg_123',
      'svix-timestamp': '1234567890',
      'svix-signature': 'v1,test',
    },
    body,
  }
}

describe('resendWebhook', () => {
  beforeEach(() => {
    verifyMock.mockReset()
    dbMocks.createDb.mockClear()
    dbMocks.update.mockClear()
    dbMocks.set.mockClear()
    dbMocks.where.mockClear()
  })

  it('rejects requests when the webhook secret is missing', async () => {
    const response = await createTestApp().request(
      '/api/webhook/resend',
      signedRequest(),
      env({ RESEND_WEBHOOK_SECRET: undefined }),
    )

    expect(response.status).toBe(503)
    expect(verifyMock).not.toHaveBeenCalled()
  })

  it('rejects requests without Svix signature headers', async () => {
    const response = await createTestApp().request(
      '/api/webhook/resend',
      {
        method: 'POST',
        body: '{}',
      },
      env(),
    )

    expect(response.status).toBe(400)
    expect(verifyMock).not.toHaveBeenCalled()
  })

  it('rejects requests with invalid signatures', async () => {
    verifyMock.mockImplementationOnce(() => {
      throw new Error('invalid signature')
    })

    const response = await createTestApp().request('/api/webhook/resend', signedRequest(), env())

    expect(response.status).toBe(400)
  })

  it('verifies the raw payload and accepts valid webhook requests', async () => {
    const payload = '{"type":"email.bounced","data":{"email_id":"email_123"}}'
    const response = await createTestApp().request(
      '/api/webhook/resend',
      signedRequest(payload),
      env(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, updatedOutbox: false })
    expect(verifyMock).toHaveBeenCalledWith({
      payload,
      headers: {
        id: 'msg_123',
        timestamp: '1234567890',
        signature: 'v1,test',
      },
      webhookSecret: 'whsec_test',
    })
  })

  it('updates tagged email outbox rows from delivery failures', async () => {
    const payload = JSON.stringify({
      type: 'email.bounced',
      data: {
        email_id: 'email_123',
        tags: { outbox_id: 'outbox_123' },
        bounce: { message: 'Mailbox unavailable' },
      },
    })
    const response = await createTestApp().request(
      '/api/webhook/resend',
      signedRequest(payload),
      env(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, updatedOutbox: true })
    expect(dbMocks.update).toHaveBeenCalled()
    expect(dbMocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        failureReason: 'Mailbox unavailable',
      }),
    )
  })
})
