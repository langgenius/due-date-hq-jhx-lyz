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
})
