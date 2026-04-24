import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { drizzleAdapter, type DB as BetterAuthDrizzleDb } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins/organization'
import { APIError } from 'better-auth/api'
import type { AuthEmailSender } from './email'
import { accessControl, roles } from './permissions'

export type AuthEnv = {
  AUTH_SECRET: string
  AUTH_URL: string
  APP_URL: string
  EMAIL_FROM: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ENV: 'development' | 'staging' | 'production'
}

/**
 * Organization plugin hooks shape. Derived via Parameters<> so we never have
 * to chase a named export across better-auth minor versions; the inferred
 * type stays correct as long as the organization() signature is stable.
 */
export type OrganizationHooks = NonNullable<
  NonNullable<Parameters<typeof organization>[0]>['organizationHooks']
>

export interface CreateAuthPluginsOptions {
  email?: AuthEmailSender
  /**
   * Hook closures are owned by the server layer (apps/server/src/auth.ts) so
   * that packages/auth never has to import @duedatehq/db (the dep-direction
   * DAG in scripts/check-dep-direction.mjs forbids it). When omitted, the
   * organization plugin runs without lifecycle side effects — useful for
   * tests that don't care about firm_profile bookkeeping.
   */
  organizationHooks?: OrganizationHooks
}

/**
 * Core `databaseHooks` shape (user / session / account lifecycle). Derived
 * via better-auth's exported options type so it stays correct across minor
 * versions without us chasing a named re-export.
 */
export type DatabaseHooks = NonNullable<BetterAuthOptions['databaseHooks']>

export interface CreateAuthDeps {
  db: BetterAuthDrizzleDb
  schema: Record<string, unknown>
  env: AuthEnv
  email?: AuthEmailSender
  /**
   * Hook closures injected by the server layer; forwarded to
   * `createAuthPlugins`. We expose this as a deps field instead of letting
   * callers replace the entire plugin array, because the organization
   * plugin's strongly-typed return is what gives `session.activeOrganizationId`
   * its type — losing that inference (e.g. via `readonly AuthPlugin[]`) would
   * cascade into every downstream `auth.api.getSession()` call.
   */
  organizationHooks?: OrganizationHooks
  /**
   * `databaseHooks` escape hatch. Server uses `session.create.before` to
   * auto-restore `activeOrganizationId` on new sessions for returning users
   * (organizationLimit:1 + onboarding-only-creates-orgs would otherwise
   * trap them). See ADR 0010 FU and apps/server/src/auth.ts.
   */
  databaseHooks?: DatabaseHooks
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

export function createAuthPlugins(opts: CreateAuthPluginsOptions = {}) {
  const { email, organizationHooks } = opts
  return [
    organization({
      ac: accessControl,
      roles,
      creatorRole: 'owner',
      allowUserToCreateOrganization: true,
      // PRD §3.6.1: 一邮箱一 Firm. P0 single tenant.
      organizationLimit: 1,
      // P0 soft ceiling matches PRD §3.6.1 Firm Plan seat_limit. The hard
      // "P0 single Owner" semantic is enforced by invitationLimit:0 +
      // beforeAddMember below — this number is only the upper safety net.
      // P1 should switch to a function: (user, org) => planSeatLimit(org.plan).
      membershipLimit: 5,
      // P0 does not expose invitations. invitationLimit:0 prevents the org
      // plugin from accepting any invite create call; beforeAddMember is the
      // belt-and-braces guard for direct member creation paths.
      invitationLimit: 0,
      // org soft-delete is governed by firm_profile.status / deletedAt
      // (PRD §3.6.8 30d grace). Hard delete via the better-auth API would
      // bypass that flow, so it stays disabled.
      disableOrganizationDeletion: true,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
      organizationHooks: {
        // Default beforeAddMember guard ensures only the creator owner is
        // ever added during P0 — caller-supplied hooks can extend this.
        ...organizationHooks,
        beforeAddMember:
          organizationHooks?.beforeAddMember ??
          (async ({ member }) => {
            if (member.role !== 'owner') {
              throw new APIError('FORBIDDEN', {
                message: 'P0 only allows the creator owner.',
              })
            }
          }),
      },
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
  ] as const
}

export function createAuth(deps: CreateAuthDeps) {
  // Build the plugin options conditionally so we don't pass explicit
  // `undefined` into optional fields — tsconfig has
  // exactOptionalPropertyTypes turned on.
  const pluginOpts: CreateAuthPluginsOptions = {}
  if (deps.email) pluginOpts.email = deps.email
  if (deps.organizationHooks) pluginOpts.organizationHooks = deps.organizationHooks
  const plugins = createAuthPlugins(pluginOpts)

  return betterAuth({
    appName: 'DueDateHQ',
    baseURL: deps.env.AUTH_URL,
    basePath: '/api/auth',
    secret: deps.env.AUTH_SECRET,
    database: drizzleAdapter(deps.db, {
      provider: 'sqlite',
      schema: deps.schema,
    }),
    socialProviders: {
      google: {
        clientId: deps.env.GOOGLE_CLIENT_ID,
        clientSecret: deps.env.GOOGLE_CLIENT_SECRET,
      },
    },
    ...(deps.databaseHooks ? { databaseHooks: deps.databaseHooks } : {}),
    plugins: [...plugins],
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
