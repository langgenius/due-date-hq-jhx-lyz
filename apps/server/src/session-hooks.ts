import { and, asc, eq } from 'drizzle-orm'
import { authSchema, type Db } from '@duedatehq/db'
import type { DatabaseHooks } from '@duedatehq/auth'

/**
 * Build better-auth's `databaseHooks` for the running Worker.
 *
 * Currently we only register `session.create.before` — the rest
 * (user/account lifecycle) stays at better-auth defaults.
 *
 * Why this exists:
 *   The protected loader treats `session.activeOrganizationId == null` as
 *   "first-time onboarding" and redirects to /onboarding, where the user is
 *   asked to create a Firm. But `organizationLimit: 1` means a returning
 *   user (any session reconstructed without an active org — e.g. they had
 *   an org but signed out across devices, or better-auth's cookie cache
 *   was invalidated) can't create a second org AND the onboarding page
 *   never tries to set-active an existing one. Without this hook they are
 *   literally stuck.
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
export function buildDatabaseHooks(db: Db): DatabaseHooks {
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
            .where(
              and(
                eq(authSchema.member.userId, session.userId),
                eq(authSchema.member.status, 'active'),
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
      },
    },
  }
}
