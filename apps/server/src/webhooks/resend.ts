import { Hono } from 'hono'
import { Resend } from 'resend'
import type { Env, ContextVars } from '../env'

type ResendWebhookEnv = Pick<Env, 'RESEND_API_KEY' | 'RESEND_WEBHOOK_SECRET'>

// /api/webhook/resend · Resend delivery events (bounce / spam / open).
export const resendWebhook = new Hono<{
  Bindings: ResendWebhookEnv
  Variables: ContextVars
}>().post('/', async (c) => {
  const webhookSecret = c.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    return c.text('Resend webhook secret is not configured', 503)
  }

  const id = c.req.header('svix-id')
  const timestamp = c.req.header('svix-timestamp')
  const signature = c.req.header('svix-signature')
  if (!id || !timestamp || !signature) {
    return c.text('Missing Resend webhook signature headers', 400)
  }

  const payload = await c.req.text()
  const resend = new Resend(c.env.RESEND_API_KEY ?? 're_webhook_signature_only')

  try {
    resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    })
  } catch {
    return c.text('Invalid Resend webhook signature', 400)
  }

  // TODO(phase-0): update email_outbox status and surface complaints.
  return c.json({ ok: true })
})
