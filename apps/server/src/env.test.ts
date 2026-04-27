import { describe, expect, it } from 'vitest'
import { validateServerEnv, type Env } from './env'

function runtimeEnv(overrides: Partial<Env> = {}): Env {
  return {
    AUTH_SECRET: '0123456789abcdefghijklmnopqrstuvwxyz',
    AUTH_URL: 'https://api.duedatehq.test',
    APP_URL: 'https://app.duedatehq.test',
    ENV: 'production',
    EMAIL_FROM: 'noreply@duedatehq.test',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    ...overrides,
  } as Env
}

describe('validateServerEnv', () => {
  it('keeps the Resend key optional outside development', () => {
    const env = validateServerEnv(runtimeEnv())

    expect(env.ENV).toBe('production')
    expect(env.RESEND_API_KEY).toBeUndefined()
  })

  it('preserves the Resend key when email sending is configured', () => {
    const env = validateServerEnv(runtimeEnv({ RESEND_API_KEY: 're_test_key' }))

    expect(env.RESEND_API_KEY).toBe('re_test_key')
  })
})
