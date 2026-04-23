import { createAuth } from '@duedatehq/auth'
import type { AuthEmailSender } from '@duedatehq/auth/email'
import { authSchema, createDb } from '@duedatehq/db'
import { Resend } from 'resend'
import { validateServerEnv, type Env, type ServerEnv } from './env'

function absoluteUrl(env: ServerEnv, pathOrUrl: string): string {
  return new URL(pathOrUrl, env.APP_URL).toString()
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function createEmailSender(env: ServerEnv): AuthEmailSender {
  async function sendEmail(input: {
    to: string
    subject: string
    html: string
    idempotencyKey: string
  }): Promise<void> {
    if (!env.RESEND_API_KEY) {
      if (env.ENV === 'development') {
        console.info(`[auth-email] ${input.subject} -> ${input.to}`)
        return
      }
      throw new Error('RESEND_API_KEY is required to send auth email')
    }

    const resend = new Resend(env.RESEND_API_KEY)
    const { error } = await resend.emails.send(
      {
        from: env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      },
      { idempotencyKey: input.idempotencyKey },
    )

    if (error) {
      throw new Error(`Resend email failed: ${error.message}`)
    }
  }

  return {
    async sendInvitationEmail(message) {
      const url = absoluteUrl(env, message.url)
      await sendEmail({
        to: message.to,
        subject: `Join ${message.organizationName} on DueDateHQ`,
        idempotencyKey: `auth-invitation/${message.invitationId}`,
        html: `<p>${escapeHtml(message.inviterName)} invited you to join ${escapeHtml(
          message.organizationName,
        )} as ${escapeHtml(message.role)}.</p><p><a href="${escapeHtml(
          url,
        )}">Accept invitation</a></p>`,
      })
    },
  }
}

export function createWorkerAuth(runtimeEnv: Env, ctx?: ExecutionContext) {
  const env = validateServerEnv(runtimeEnv)
  const deps = {
    db: createDb(runtimeEnv.DB),
    schema: authSchema,
    env,
    email: createEmailSender(env),
  }

  if (ctx) {
    return createAuth({
      ...deps,
      waitUntil: (promise) => ctx.waitUntil(promise),
    })
  }

  return createAuth(deps)
}
