import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { drizzleAdapter, type DB as BetterAuthDrizzleDb } from 'better-auth/adapters/drizzle'
import {
  stripe,
  type AuthorizeReferenceAction,
  type StripePlan,
  type Subscription,
} from '@better-auth/stripe'
import { organization } from 'better-auth/plugins/organization'
import { APIError } from 'better-auth/api'
import StripeClient from 'stripe'
import type { AuthEmailSender } from './email'
import { accessControl, roles } from './permissions'

export type AuthEnv = {
  AUTH_SECRET: string
  AUTH_URL: string
  APP_URL: string
  EMAIL_FROM: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  STRIPE_SECRET_KEY?: string | undefined
  STRIPE_WEBHOOK_SECRET?: string | undefined
  STRIPE_PRICE_FIRM_MONTHLY?: string | undefined
  STRIPE_PRICE_FIRM_YEARLY?: string | undefined
  STRIPE_PRICE_PRO_MONTHLY?: string | undefined
  STRIPE_PRICE_PRO_YEARLY?: string | undefined
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
type OrganizationPluginOptions = NonNullable<Parameters<typeof organization>[0]>

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
  organizationMembershipLimit?: OrganizationPluginOptions['membershipLimit']
  organizationInvitationLimit?: OrganizationPluginOptions['invitationLimit']
  stripeBilling?: StripeBillingOptions
}

/**
 * Core `databaseHooks` shape (user / session / account lifecycle). Derived
 * via better-auth's exported options type so it stays correct across minor
 * versions without us chasing a named re-export.
 */
export type DatabaseHooks = NonNullable<BetterAuthOptions['databaseHooks']>

export type BillingPlan = 'solo' | 'firm' | 'pro'

export interface StripeSubscriptionSyncInput {
  referenceId: string
  plan: BillingPlan
  seatLimit: number
  stripeCustomerId: string | undefined
  stripeSubscriptionId: string | undefined
  status: Subscription['status']
}

export interface StripeBillingHooks {
  authorizeReference(input: {
    userId: string
    sessionId: string
    activeOrganizationId?: string
    referenceId: string
    action: AuthorizeReferenceAction
  }): Promise<boolean>
  syncSubscription(input: StripeSubscriptionSyncInput): Promise<void>
}

export interface StripeBillingOptions {
  hooks: StripeBillingHooks
}

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
  organizationMembershipLimit?: OrganizationPluginOptions['membershipLimit']
  organizationInvitationLimit?: OrganizationPluginOptions['invitationLimit']
  stripeBilling?: StripeBillingOptions
  /**
   * `databaseHooks` escape hatch. Server uses `session.create.before` to
   * auto-restore `activeOrganizationId` on new sessions for returning users
   * whose session is missing an active firm. See ADR 0010 FU and
   * apps/server/src/auth.ts.
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

function isStripeConfigured(env: AuthEnv): env is AuthEnv & {
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRICE_PRO_MONTHLY: string
} {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRICE_PRO_MONTHLY)
}

function stripePlans(env: AuthEnv): StripePlan[] {
  const plans: StripePlan[] = [
    {
      name: 'pro',
      priceId: env.STRIPE_PRICE_PRO_MONTHLY,
      annualDiscountPriceId: env.STRIPE_PRICE_PRO_YEARLY,
      limits: { seats: 5 },
      freeTrial: { days: 14 },
    },
  ]

  if (env.STRIPE_PRICE_FIRM_MONTHLY || env.STRIPE_PRICE_FIRM_YEARLY) {
    plans.push({
      name: 'firm',
      priceId: env.STRIPE_PRICE_FIRM_MONTHLY,
      annualDiscountPriceId: env.STRIPE_PRICE_FIRM_YEARLY,
      limits: { seats: 10 },
    })
  }

  return plans
}

function planSeatLimit(plan: BillingPlan): number {
  if (plan === 'firm') return 10
  if (plan === 'pro') return 5
  return 1
}

function activeBillingPlan(subscription: Subscription): BillingPlan {
  if (
    subscription.status === 'active' ||
    subscription.status === 'trialing' ||
    subscription.status === 'past_due' ||
    subscription.status === 'paused'
  ) {
    return subscription.plan === 'firm' ? 'firm' : 'pro'
  }
  return 'solo'
}

function syncInput(subscription: Subscription): StripeSubscriptionSyncInput {
  const plan = activeBillingPlan(subscription)
  return {
    referenceId: subscription.referenceId,
    plan,
    seatLimit: planSeatLimit(plan),
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    status: subscription.status,
  }
}

function isKnownFirmRole(role: string): boolean {
  return role === 'owner' || role === 'manager' || role === 'preparer' || role === 'coordinator'
}

export function createAuthPlugins(opts: CreateAuthPluginsOptions = {}, env?: AuthEnv) {
  const { email, organizationHooks } = opts
  const organizationPlugin = organization({
    ac: accessControl,
    roles,
    creatorRole: 'owner',
    allowUserToCreateOrganization: true,
    // Better Auth owns the identity primitives; DueDateHQ's members gateway
    // owns current-firm, seat, audit, and Owner-only business rules. Server
    // injects the plan-aware membership limit because packages/auth cannot
    // depend on @duedatehq/db.
    membershipLimit: opts.organizationMembershipLimit ?? 5,
    invitationLimit: opts.organizationInvitationLimit ?? 100,
    // org soft-delete is governed by firm_profile.status / deletedAt
    // (PRD §3.6.8 30d grace). Hard delete via the better-auth API would
    // bypass that flow, so it stays disabled.
    disableOrganizationDeletion: true,
    invitationExpiresIn: 60 * 60 * 24 * 7,
    cancelPendingInvitationsOnReInvite: true,
    organizationHooks: {
      // Default guard keeps the role vocabulary tight when tests construct
      // auth without server-owned DB hooks. Server hooks add firm/seat gates.
      ...organizationHooks,
      beforeAddMember:
        organizationHooks?.beforeAddMember ??
        (async ({ member }) => {
          if (!isKnownFirmRole(member.role)) {
            throw new APIError('FORBIDDEN', {
              message: 'Unknown firm role.',
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
  })

  if (env && opts.stripeBilling && isStripeConfigured(env)) {
    const stripeSecret = env.STRIPE_SECRET_KEY
    const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET
    const stripeClient = new StripeClient(stripeSecret)
    const stripePlugin = stripe({
      stripeClient,
      stripeWebhookSecret,
      subscription: {
        enabled: true,
        plans: stripePlans(env),
        authorizeReference: async ({ user, session, referenceId, action }) =>
          opts.stripeBilling?.hooks.authorizeReference({
            userId: user.id,
            sessionId: session.id,
            activeOrganizationId: session.activeOrganizationId,
            referenceId,
            action,
          }) ?? false,
        onSubscriptionComplete: async ({ subscription }) => {
          await opts.stripeBilling?.hooks.syncSubscription(syncInput(subscription))
        },
        onSubscriptionCreated: async ({ subscription }) => {
          await opts.stripeBilling?.hooks.syncSubscription(syncInput(subscription))
        },
        onSubscriptionUpdate: async ({ subscription }) => {
          await opts.stripeBilling?.hooks.syncSubscription(syncInput(subscription))
        },
        onSubscriptionDeleted: async ({ subscription }) => {
          await opts.stripeBilling?.hooks.syncSubscription({
            ...syncInput(subscription),
            plan: 'solo',
            seatLimit: 1,
            stripeSubscriptionId: undefined,
          })
        },
      },
      organization: { enabled: true },
    })
    return [organizationPlugin, stripePlugin] as const
  }

  return [organizationPlugin] as const
}

export function createAuth(deps: CreateAuthDeps) {
  // Build the plugin options conditionally so we don't pass explicit
  // `undefined` into optional fields — tsconfig has
  // exactOptionalPropertyTypes turned on.
  const pluginOpts: CreateAuthPluginsOptions = {}
  if (deps.email) pluginOpts.email = deps.email
  if (deps.organizationHooks) pluginOpts.organizationHooks = deps.organizationHooks
  if (deps.organizationMembershipLimit) {
    pluginOpts.organizationMembershipLimit = deps.organizationMembershipLimit
  }
  if (deps.organizationInvitationLimit) {
    pluginOpts.organizationInvitationLimit = deps.organizationInvitationLimit
  }
  if (deps.stripeBilling) pluginOpts.stripeBilling = deps.stripeBilling
  const plugins = createAuthPlugins(pluginOpts, deps.env)

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
