import { Hono } from 'hono'
import type { Env, ContextVars } from './env'
import { requestIdMiddleware } from './middleware/logger'
import { sessionMiddleware } from './middleware/session'
import { tenantMiddleware } from './middleware/tenant'
import { rateLimitMiddleware } from './middleware/rate-limit'
import { authRoute } from './routes/auth'
import { healthRoute } from './routes/health'
import { resendWebhook } from './webhooks/resend'
import { rpcHandler } from './rpc'

/**
 * Hono app assembly.
 *
 * Route prefix discipline (docs/Dev File/02 §3 · ADR 0008):
 *   /rpc/*            → RPCHandler (internal frontend only)
 *   /api/auth/*       → better-auth
 *   /api/webhook/*    → narrow external callbacks
 *   /api/health       → liveness
 *   /api/v1/*         → OpenAPIHandler (Phase 2, reserved; do not add here)
 *   other             → ASSETS binding + SPA fallback (wrangler.toml)
 */
export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: ContextVars }>()

  app.use('*', requestIdMiddleware)

  // /api/health — public liveness probe (no auth, no tenant).
  app.route('/api/health', healthRoute)

  // /api/auth/* — better-auth handler (Organization + Access Control + magicLink).
  app.route('/api/auth', authRoute)

  // /api/webhook/* — external callbacks (IP allowlist + signature).
  app.route('/api/webhook/resend', resendWebhook)

  // /rpc/* — oRPC RPCHandler.
  // Order is load-bearing: session MUST run before tenant (tenant needs firmId from session)
  // and before rate-limit (rate-limit keys off userId when present, falls back to IP).
  app.use('/rpc/*', sessionMiddleware, tenantMiddleware, rateLimitMiddleware)
  app.all('/rpc/*', async (c) => rpcHandler(c.req.raw, c.env, { vars: c.var }))

  // Reserved for Phase 2 — public OpenAPIHandler routes. Do not mount a default
  // catch-all here; undefined paths fall through to ASSETS (wrangler.toml).
  // app.all('/api/v1/*', openApiHandler)

  return app
}
