import { and, eq } from 'drizzle-orm'
import type { StripeBillingHooks, StripeSubscriptionSyncInput } from '@duedatehq/auth'
import { authSchema, firmSchema, type Db } from '@duedatehq/db'

function isOwnerRole(role: string | null | undefined): boolean {
  return role === 'owner'
}

export function buildBillingHooks(db: Db): StripeBillingHooks {
  return {
    async authorizeReference(input) {
      void input.action
      if (input.activeOrganizationId !== input.referenceId) return false

      const [membership] = await db
        .select({ role: authSchema.member.role, status: authSchema.member.status })
        .from(authSchema.member)
        .where(
          and(
            eq(authSchema.member.organizationId, input.referenceId),
            eq(authSchema.member.userId, input.userId),
          ),
        )
        .limit(1)

      return Boolean(membership && isOwnerRole(membership.role) && membership.status === 'active')
    },

    async syncSubscription(input: StripeSubscriptionSyncInput) {
      await db
        .update(firmSchema.firmProfile)
        .set({
          plan: input.plan,
          seatLimit: input.seatLimit,
          billingCustomerId: input.stripeCustomerId ?? null,
          billingSubscriptionId: input.stripeSubscriptionId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(firmSchema.firmProfile.id, input.referenceId))
    },
  }
}
