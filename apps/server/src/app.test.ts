import { describe, expect, it } from 'vitest'
import { createApp } from './app'
import { pickSafeDemoRedirect, readDemoRoleParam } from './routes/e2e'

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

  it('does not expose the demo accounts route outside development', async () => {
    const app = createApp()
    const response = await app.request('/api/e2e/demo-accounts', {}, { ENV: 'staging' })

    expect(response.status).toBe(404)
  })

  it('does not expose demo routes in production even with the seed token', async () => {
    const app = createApp()
    const env = {
      ENV: 'production',
      E2E_SEED_TOKEN: 'seed-token-seed-token',
    }
    const init = { headers: { authorization: 'Bearer seed-token-seed-token' } }

    const login = await app.request('/api/e2e/demo-login', init, env)
    const accounts = await app.request('/api/e2e/demo-accounts', init, env)

    expect(login.status).toBe(404)
    expect(accounts.status).toBe(404)
  })

  it('rejects unknown demo login roles before touching demo data', async () => {
    const app = createApp()
    const response = await app.request('/api/e2e/demo-login?role=admin', {}, { ENV: 'development' })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid demo role.' })
  })

  it('parses supported demo roles and defaults missing role to owner', () => {
    expect(readDemoRoleParam(null)).toBe('owner')
    expect(readDemoRoleParam('')).toBe('owner')
    expect(readDemoRoleParam('owner')).toBe('owner')
    expect(readDemoRoleParam('manager')).toBe('manager')
    expect(readDemoRoleParam('preparer')).toBe('preparer')
    expect(readDemoRoleParam('coordinator')).toBe('coordinator')
    expect(readDemoRoleParam('admin')).toBeNull()
  })

  it('keeps demo login redirects inside the app', () => {
    expect(pickSafeDemoRedirect('/workboard?owner=unassigned#row')).toBe(
      '/workboard?owner=unassigned#row',
    )
    expect(pickSafeDemoRedirect('https://example.com')).toBe('/')
    expect(pickSafeDemoRedirect('//example.com')).toBe('/')
    expect(pickSafeDemoRedirect(null)).toBe('/')
  })
})
