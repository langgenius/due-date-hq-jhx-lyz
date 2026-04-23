import { describe, expect, it } from 'vitest'
import { createApp } from './app'
import type { Env } from './env'

describe('@duedatehq/server app', () => {
  it('serves the public health route', async () => {
    const app = createApp()
    const response = await app.request('/api/health', {}, { ENV: 'development' } as Env)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ status: 'ok', env: 'development' })
    expect(typeof body.requestId).toBe('string')
  })
})
