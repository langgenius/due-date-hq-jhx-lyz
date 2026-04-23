// Single source of truth for Worker bindings + secrets.
// Every handler that touches env goes through this type (no `any` c.env anywhere).

export interface Env {
  // Cloudflare bindings (wrangler.toml)
  DB: D1Database
  CACHE: KVNamespace
  RATE_LIMIT: RateLimit
  R2_PDF: R2Bucket
  R2_MIGRATION: R2Bucket
  R2_AUDIT: R2Bucket
  VECTORS: VectorizeIndex
  EMAIL_QUEUE: Queue
  ASSETS: Fetcher

  // Secrets (wrangler secret put)
  AUTH_SECRET: string
  AUTH_URL: string
  APP_URL: string
  ENV: 'development' | 'staging' | 'production'

  AI_GATEWAY_ACCOUNT_ID: string
  AI_GATEWAY_SLUG: string
  OPENAI_API_KEY: string
  ANTHROPIC_API_KEY: string
  LANGFUSE_PUBLIC_KEY: string
  LANGFUSE_SECRET_KEY: string

  RESEND_API_KEY: string
  EMAIL_FROM: string

  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string

  SENTRY_DSN: string
  POSTHOG_KEY: string
}

// Hono context variables populated by middleware.
export interface ContextVars {
  requestId: string
  firmId?: string
  userId?: string
  scoped?: import('@duedatehq/db').ScopedRepo
}
