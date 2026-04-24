import { createAuth } from '@duedatehq/auth'
import type { AuthEmailSender } from '@duedatehq/auth/email'
import { authSchema, createDb } from '@duedatehq/db'
import { Resend } from 'resend'
import { validateServerEnv, type Env, type ServerEnv } from './env'
import { getRequestLocale } from './i18n/resolve'
import { translate } from './i18n/messages'
import { buildOrganizationHooks } from './organization-hooks'

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
      const locale = getRequestLocale()
      const vars = {
        organizationName: escapeHtml(message.organizationName),
        inviterName: escapeHtml(message.inviterName),
        role: escapeHtml(message.role),
      }
      const subject = translate(locale, 'invitation.subject', {
        organizationName: message.organizationName,
      })
      const body = translate(locale, 'invitation.body', vars)
      const cta = translate(locale, 'invitation.cta')
      await sendEmail({
        to: message.to,
        subject,
        idempotencyKey: `auth-invitation/${message.invitationId}`,
        html: `<p>${body}</p><p><a href="${escapeHtml(url)}">${cta}</a></p>`,
      })
    },
  }
}

export function createWorkerAuth(runtimeEnv: Env, ctx?: ExecutionContext) {
  const env = validateServerEnv(runtimeEnv)
  const db = createDb(runtimeEnv.DB)
  const email = createEmailSender(env)

  // Hook closures live in apps/server (not in packages/auth) because they
  // import the firm_profile schema. See organization-hooks.ts and the
  // dep-direction DAG in scripts/check-dep-direction.mjs.
  const organizationHooks = buildOrganizationHooks(db)

  return createAuth({
    db,
    schema: authSchema,
    env,
    email,
    organizationHooks,
    ...(ctx ? { waitUntil: (promise) => ctx.waitUntil(promise) } : {}),
  })
}
