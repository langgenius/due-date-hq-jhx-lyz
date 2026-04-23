import { betterAuth } from 'better-auth'
import { drizzleAdapter, type DB as BetterAuthDrizzleDb } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins/magic-link'
import { organization } from 'better-auth/plugins/organization'
import type { AuthEmailSender } from './email'
import { accessControl, roles } from './permissions'

export type AuthEnv = {
  AUTH_SECRET: string
  AUTH_URL: string
  APP_URL: string
  EMAIL_FROM: string
  ENV: 'development' | 'staging' | 'production'
}

export interface CreateAuthDeps {
  db: BetterAuthDrizzleDb
  schema: Record<string, unknown>
  env: AuthEnv
  email?: AuthEmailSender
  waitUntil?: (promise: Promise<unknown>) => void
}

function toOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin
  } catch {
    return undefined
  }
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string'
}

function trustedOrigins(env: AuthEnv): string[] {
  return Array.from(new Set([toOrigin(env.AUTH_URL), toOrigin(env.APP_URL)].filter(isString)))
}

export function createAuthPlugins(email?: AuthEmailSender) {
  return [
    organization({
      ac: accessControl,
      roles,
      creatorRole: 'owner',
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
      schema: {
        member: {
          additionalFields: {
            status: {
              type: 'string',
              required: true,
              defaultValue: 'active',
              input: false,
            },
          },
        },
      },
      sendInvitationEmail: async (data) => {
        await email?.sendInvitationEmail({
          to: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name,
          invitationId: data.id,
          role: data.role,
          url: `/accept-invite?id=${encodeURIComponent(data.id)}`,
        })
      },
    }),
    magicLink({
      expiresIn: 60 * 15,
      allowedAttempts: 1,
      storeToken: 'hashed',
      sendMagicLink: async ({ email: to, token, url }) => {
        await email?.sendMagicLinkEmail({ to, token, url })
      },
    }),
  ] as const
}

export function createAuth(deps: CreateAuthDeps) {
  return betterAuth({
    appName: 'DueDateHQ',
    baseURL: deps.env.AUTH_URL,
    basePath: '/api/auth',
    secret: deps.env.AUTH_SECRET,
    database: drizzleAdapter(deps.db, {
      provider: 'sqlite',
      schema: deps.schema,
    }),
    plugins: [...createAuthPlugins(deps.email)],
    trustedOrigins: trustedOrigins(deps.env),
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      cookiePrefix: 'duedatehq',
      useSecureCookies: deps.env.ENV !== 'development',
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
      },
      ...(deps.waitUntil
        ? {
            backgroundTasks: {
              handler: deps.waitUntil,
            },
          }
        : {}),
    },
  })
}

export type AuthInstance = ReturnType<typeof createAuth>
export type ServerSession = NonNullable<Awaited<ReturnType<AuthInstance['api']['getSession']>>>
