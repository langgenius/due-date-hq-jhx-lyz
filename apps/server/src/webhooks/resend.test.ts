import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env, ContextVars } from '../env'
import { resendWebhook } from './resend'

type TestEnv = Pick<Env, 'RESEND_API_KEY' | 'RESEND_WEBHOOK_SECRET'>

const { verifyMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    webhooks = {
      verify: verifyMock,
    }
  },
}))

function createTestApp() {
  const app = new Hono<{ Bindings: TestEnv; Variables: ContextVars }>()
  app.route('/api/webhook/resend', resendWebhook)
  return app
}

function env(overrides: Partial<TestEnv> = {}): TestEnv {
  return {
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
    await expect(response.json()).resolves.toEqual({ ok: true })
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
})
