import { Hono } from 'hono'
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { createDb } from '@duedatehq/db'
import { emailOutbox } from '@duedatehq/db/schema/notifications'
import type { Env, ContextVars } from '../env'

type ResendWebhookEnv = Pick<Env, 'DB' | 'RESEND_API_KEY' | 'RESEND_WEBHOOK_SECRET'>

type OutboxWebhookUpdate = {
  outboxId: string
  status: 'sent' | 'failed'
  failureReason: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function failureReasonFor(type: string, data: Record<string, unknown>): string {
  if (isRecord(data.failed)) {
    return readString(data.failed.reason) ?? type
  }
  if (isRecord(data.bounce)) {
    return readString(data.bounce.message) ?? type
  }
  if (isRecord(data.suppressed)) {
    return readString(data.suppressed.message) ?? type
  }
  return type
}

function parseWebhookUpdate(payload: string): OutboxWebhookUpdate | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return null
  }
  if (!isRecord(parsed) || !isRecord(parsed.data)) return null

  const type = readString(parsed.type)
  const tags = isRecord(parsed.data.tags) ? parsed.data.tags : null
  const outboxId = tags ? readString(tags.outbox_id) : null
  if (!type || !outboxId) return null

  if (type === 'email.sent' || type === 'email.delivered') {
    return { outboxId, status: 'sent', failureReason: null }
  }
  if (
    type === 'email.failed' ||
    type === 'email.bounced' ||
    type === 'email.complained' ||
    type === 'email.suppressed'
  ) {
    return {
      outboxId,
      status: 'failed',
      failureReason: failureReasonFor(type, parsed.data),
    }
  }
  return null
}

async function updateOutboxFromWebhook(env: ResendWebhookEnv, payload: string): Promise<boolean> {
  const update = parseWebhookUpdate(payload)
  if (!update) return false

  const db = createDb(env.DB)
  await db
    .update(emailOutbox)
    .set({
      status: update.status,
      ...(update.status === 'sent'
        ? { sentAt: new Date(), failureReason: null }
        : { failedAt: new Date(), failureReason: update.failureReason }),
    })
    .where(eq(emailOutbox.id, update.outboxId))
  return true
}

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

  const updatedOutbox = await updateOutboxFromWebhook(c.env, payload)
  return c.json({ ok: true, updatedOutbox })
})
