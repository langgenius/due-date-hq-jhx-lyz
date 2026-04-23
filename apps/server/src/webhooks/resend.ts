import { Hono } from 'hono'
import type { Env, ContextVars } from '../env'

// /api/webhook/resend · Resend delivery events (bounce / spam / open).
// Must verify signature + IP allowlist before any side effect.
export const resendWebhook = new Hono<{ Bindings: Env; Variables: ContextVars }>().post(
  '/',
  async (c) => {
    // TODO(phase-0): verify Resend signature, update email_outbox status, surface complaints.
    return c.json({ ok: true })
  },
)
