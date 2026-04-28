import { createEnv } from '@t3-oss/env-core'
import type { ServerSession } from '@duedatehq/auth'
import * as z from 'zod'

const serverEnvSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.url(),
  APP_URL: z.url(),
  ENV: z.enum(['development', 'staging', 'production']).default('development'),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
  EMAIL_FROM: z.email(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_FIRM_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_FIRM_YEARLY: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().min(1).optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ServerEnvInput = Partial<ServerEnv> &
  Pick<
    ServerEnv,
    | 'AUTH_SECRET'
    | 'AUTH_URL'
    | 'APP_URL'
    | 'EMAIL_FROM'
    | 'GOOGLE_CLIENT_ID'
    | 'GOOGLE_CLIENT_SECRET'
  >

export interface WorkerBindings {
  DB: D1Database
  CACHE: KVNamespace
  RATE_LIMIT: RateLimit
  R2_PDF: R2Bucket
  R2_MIGRATION: R2Bucket
  R2_AUDIT: R2Bucket
  VECTORS: VectorizeIndex
  EMAIL_QUEUE: Queue
  ASSETS: Fetcher
}

export interface Env extends WorkerBindings, ServerEnv {
  AI_GATEWAY_ACCOUNT_ID: string
  AI_GATEWAY_SLUG: string
  AI_GATEWAY_API_KEY: string
  AI_GATEWAY_PROVIDER: string
  AI_GATEWAY_PROVIDER_API_KEY: string
  AI_GATEWAY_MODEL: string
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
  SENTRY_DSN: string
  POSTHOG_KEY: string
}

export function validateServerEnv(runtimeEnv: ServerEnvInput): ServerEnv {
  const env = createEnv({
    server: serverEnvSchema.shape,
    runtimeEnv: {
      AUTH_SECRET: runtimeEnv.AUTH_SECRET,
      AUTH_URL: runtimeEnv.AUTH_URL,
      APP_URL: runtimeEnv.APP_URL,
      ENV: runtimeEnv.ENV,
      RESEND_API_KEY: runtimeEnv.RESEND_API_KEY,
      RESEND_WEBHOOK_SECRET: runtimeEnv.RESEND_WEBHOOK_SECRET,
      EMAIL_FROM: runtimeEnv.EMAIL_FROM,
      GOOGLE_CLIENT_ID: runtimeEnv.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: runtimeEnv.GOOGLE_CLIENT_SECRET,
      STRIPE_SECRET_KEY: runtimeEnv.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: runtimeEnv.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRICE_FIRM_MONTHLY: runtimeEnv.STRIPE_PRICE_FIRM_MONTHLY,
      STRIPE_PRICE_FIRM_YEARLY: runtimeEnv.STRIPE_PRICE_FIRM_YEARLY,
      STRIPE_PRICE_PRO_MONTHLY: runtimeEnv.STRIPE_PRICE_PRO_MONTHLY,
      STRIPE_PRICE_PRO_YEARLY: runtimeEnv.STRIPE_PRICE_PRO_YEARLY,
    },
    emptyStringAsUndefined: true,
  })

  return env
}

export interface ContextVars {
  requestId: string
  session?: ServerSession['session']
  user?: ServerSession['user']
  firmId?: string
  userId?: string
  firms?: import('@duedatehq/db').FirmsRepo
  members?: import('@duedatehq/db').MembersRepo
  scoped?: import('@duedatehq/db').ScopedRepo
  /**
   * Resolved business-tenant view for the request. Composed by
   * `middleware/tenant.ts` from `firm_profile` (read or lazy-created).
   * Procedures gate on `plan` / `seatLimit` / `status` via this object
   * instead of re-querying. See ADR 0010.
   */
  tenantContext?: import('@duedatehq/db').TenantContext
}
