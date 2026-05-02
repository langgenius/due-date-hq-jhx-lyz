import { and, asc, eq } from 'drizzle-orm'
import { authSchema, firmSchema, type Db } from '@duedatehq/db'
import { createAuditWriter } from '@duedatehq/db/audit-writer'
import type { DatabaseHooks } from '@duedatehq/auth'
import { sha256Hex } from './lib/readiness-token'

/**
 * Build better-auth's `databaseHooks` for the running Worker.
 *
 * Currently we register `session.create.before` for active organization
 * restoration and `session.create.after` for firm-scoped login audit.
 * The rest (user/account lifecycle) stays at better-auth defaults.
 *
 * Why this exists:
 *   The protected loader treats `session.activeOrganizationId == null` as
 *   "first-time onboarding" and redirects to /onboarding, where the user is
 *   asked to create a Firm. Returning users with existing memberships should
 *   land in one of their firms instead of the first-login setup route.
 *
 *   The fix per the better-auth organization docs: on session create, if
 *   the user already has an active membership, auto-populate
 *   activeOrganizationId on the brand-new session row. First-time users
 *   (no memberships) get `null` and land in /onboarding as designed.
 *
 *   Lives in the server layer (NOT in packages/auth) because it imports
 *   the auth schema via the drizzle db handle. `packages/auth` can't
 *   depend on `@duedatehq/db` (scripts/check-dep-direction.mjs).
 */
async function hashValue(
  secret: string,
  value: string | null | undefined,
): Promise<string | undefined> {
  if (!value) return undefined
  return sha256Hex(`${secret}:${value}`)
}

export function buildDatabaseHooks(db: Db, secret: string): DatabaseHooks {
  const audit = createAuditWriter(db)
  return {
    session: {
      create: {
        before: async (session) => {
          // Defensive guard for the (impossible-in-practice) case userId is
          // missing on the base Session shape.
          if (!session.userId) return undefined

          const [earliestMembership] = await db
            .select({ organizationId: authSchema.member.organizationId })
            .from(authSchema.member)
            .innerJoin(
              firmSchema.firmProfile,
              eq(firmSchema.firmProfile.id, authSchema.member.organizationId),
            )
            .where(
              and(
                eq(authSchema.member.userId, session.userId),
                eq(authSchema.member.status, 'active'),
                eq(firmSchema.firmProfile.status, 'active'),
              ),
            )
            .orderBy(asc(authSchema.member.createdAt))
            .limit(1)

          // First-time user has no memberships yet — return undefined so
          // better-auth writes the session as-is (activeOrganizationId null);
          // the protected loader then redirects to /onboarding.
          if (!earliestMembership) return undefined

          return {
            data: {
              ...session,
              activeOrganizationId: earliestMembership.organizationId,
            },
          }
        },
        after: async (session) => {
          const firmId =
            typeof session.activeOrganizationId === 'string'
              ? session.activeOrganizationId
              : undefined
          if (!session.userId || !firmId) return
          try {
            const ipHash = await hashValue(secret, session.ipAddress)
            const userAgentHash = await hashValue(secret, session.userAgent)
            await audit.write({
              firmId,
              actorId: session.userId,
              entityType: 'auth_session',
              entityId: session.id,
              action: 'auth.login.success',
              after: {
                sessionId: session.id,
                provider: 'oauth',
              },
              ...(ipHash ? { ipHash } : {}),
              ...(userAgentHash ? { userAgentHash } : {}),
            })
          } catch {
            // Session creation must not fail if audit persistence is temporarily unavailable.
          }
        },
      },
    },
  }
}
