import { describe, expect, it } from 'vitest'
import { validateServerEnv, type ServerEnvInput } from './env'

function runtimeEnv(overrides: Partial<ServerEnvInput> = {}): ServerEnvInput {
  return {
    AUTH_SECRET: '0123456789abcdefghijklmnopqrstuvwxyz',
    AUTH_URL: 'https://api.duedatehq.test',
    APP_URL: 'https://app.duedatehq.test',
    ENV: 'production',
    EMAIL_FROM: 'noreply@duedatehq.test',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    ...overrides,
  }
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

  it('preserves the Resend webhook secret when delivery callbacks are configured', () => {
    const env = validateServerEnv(runtimeEnv({ RESEND_WEBHOOK_SECRET: 'whsec_test' }))

    expect(env.RESEND_WEBHOOK_SECRET).toBe('whsec_test')
  })

  it('preserves Stripe billing settings when checkout is configured', () => {
    const env = validateServerEnv(
      runtimeEnv({
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_stripe',
        STRIPE_PRICE_PRO_MONTHLY: 'price_pro_monthly',
      }),
    )

    expect(env.STRIPE_SECRET_KEY).toBe('sk_test_123')
    expect(env.STRIPE_WEBHOOK_SECRET).toBe('whsec_stripe')
    expect(env.STRIPE_PRICE_PRO_MONTHLY).toBe('price_pro_monthly')
  })

  it('keeps Microsoft OAuth optional but validates paired credentials', () => {
    const env = validateServerEnv(
      runtimeEnv({
        MICROSOFT_CLIENT_ID: 'microsoft-client-id',
        MICROSOFT_CLIENT_SECRET: 'microsoft-client-secret',
        MICROSOFT_TENANT_ID: 'organizations',
      }),
    )

    expect(env.MICROSOFT_CLIENT_ID).toBe('microsoft-client-id')
    expect(env.MICROSOFT_CLIENT_SECRET).toBe('microsoft-client-secret')
    expect(env.MICROSOFT_TENANT_ID).toBe('organizations')
    expect(() =>
      validateServerEnv(runtimeEnv({ MICROSOFT_CLIENT_ID: 'microsoft-client-id' })),
    ).toThrow(/MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET/)
  })
})
