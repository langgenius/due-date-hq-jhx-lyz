import { APIError } from 'better-auth/api'
import { firmSchema, type Db } from '@duedatehq/db'
import type { OrganizationHooks } from '@duedatehq/auth'

/**
 * Build the organization-plugin lifecycle hooks for the running Worker.
 *
 * Lives in the server layer (NOT in packages/auth) because it imports the
 * firm_profile schema — the dep-direction DAG (scripts/check-dep-direction.mjs)
 * forbids packages/auth from importing @duedatehq/db.
 *
 * Exported as a standalone factory so unit tests can mock `db.insert` and
 * assert the inserted row shape without spinning up a real Worker / D1.
 *
 * Failure semantics (recorded in dev-log 2026-04-24):
 *   - `afterCreateOrganization` swallows DB errors and only logs.
 *     Better Auth does not roll back the organization row when this hook
 *     throws — throwing only surfaces an opaque error to the user. The
 *     real safety net is `tenantMiddleware` lazy-creating the firm_profile
 *     on the next request, so the worst-case is one extra round-trip.
 *   - `beforeAddMember` throws APIError('FORBIDDEN') when role!=='owner';
 *     this is the P0 single-Owner enforcement (PRD §3.6.1).
 */
export function buildOrganizationHooks(db: Db): OrganizationHooks {
  return {
    afterCreateOrganization: async ({ organization, user }) => {
      const now = new Date()
      try {
        await db.insert(firmSchema.firmProfile).values({
          id: organization.id,
          name: organization.name,
          plan: 'solo',
          seatLimit: 1,
          // Default tz is a P0 ICP assumption (PRD §2.1: US CPA).
          // P1 onboarding will let the user pick — see ADR 0010 follow-ups.
          timezone: 'America/New_York',
          ownerUserId: user.id,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        })
      } catch (err) {
        // Swallow + log. Throwing here would surface to the onboarding
        // submit, but the org row stays committed (better-auth doesn't
        // roll back), leaving an orphan that tenantMiddleware's lazy
        // create handles cleanly. Preferring deterministic behavior over
        // fail-fast since the next request fixes things automatically.
        console.error('[firm_profile.afterCreateOrganization] insert failed', {
          orgId: organization.id,
          userId: user.id,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    },
    beforeAddMember: async ({ member }) => {
      if (member.role !== 'owner') {
        throw new APIError('FORBIDDEN', {
          message: 'P0 only allows the creator owner.',
        })
      }
    },
  }
}
