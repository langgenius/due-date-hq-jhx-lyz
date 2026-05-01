import { describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('@duedatehq/server app', () => {
  it('serves the public health route', async () => {
    const app = createApp()
    const response = await app.request('/api/health', {}, { ENV: 'development' })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      status: 'ok',
      env: 'development',
      requestId: expect.any(String),
    })
  })

  it('does not expose the e2e session route outside development', async () => {
    const app = createApp()
    const response = await app.request('/api/e2e/session', { method: 'POST' }, { ENV: 'staging' })

    expect(response.status).toBe(404)
  })

  it('does not expose the demo login route outside development', async () => {
    const app = createApp()
    const response = await app.request('/api/e2e/demo-login', {}, { ENV: 'staging' })

    expect(response.status).toBe(404)
  })
})
