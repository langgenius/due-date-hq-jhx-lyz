import { and, asc, desc, eq, ne, isNull } from 'drizzle-orm'
import { createAuditWriter, type AuditEventInput } from '../audit-writer'
import type { Db } from '../client'
import { member, organization, session, subscription } from '../schema/auth'
import { firmProfile, type FirmProfile } from '../schema/firm'

export type FirmRole = 'owner' | 'manager' | 'preparer' | 'coordinator'

export interface FirmMembershipRow {
  id: string
  name: string
  slug: string
  plan: FirmProfile['plan']
  seatLimit: number
  timezone: string
  status: FirmProfile['status']
  role: FirmRole
  ownerUserId: string
  coordinatorCanSeeDollars: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface FirmUpdateInput {
  name: string
  timezone: string
  coordinatorCanSeeDollars?: boolean
}

export interface FirmBillingSubscriptionRow {
  id: string
  plan: string
  referenceId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  status: string
  periodStart: Date | null
  periodEnd: Date | null
  trialStart: Date | null
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
  cancelAt: Date | null
  canceledAt: Date | null
  endedAt: Date | null
  seats: number | null
  billingInterval: string | null
  stripeScheduleId: string | null
  createdAt: Date
  updatedAt: Date
}

function normalizeRole(value: string): FirmRole {
  switch (value) {
    case 'owner':
    case 'manager':
    case 'preparer':
    case 'coordinator':
      return value
    default:
      return 'coordinator'
  }
}

function toMembershipRow(row: {
  id: string
  name: string
  slug: string
  plan: FirmProfile['plan']
  seatLimit: number
  timezone: string
  status: FirmProfile['status']
  role: string
  ownerUserId: string
  coordinatorCanSeeDollars: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}): FirmMembershipRow {
  return {
    ...row,
    role: normalizeRole(row.role),
  }
}

function baseFirmSelect(db: Db) {
  return db
    .select({
      id: firmProfile.id,
      name: firmProfile.name,
      slug: organization.slug,
      plan: firmProfile.plan,
      seatLimit: firmProfile.seatLimit,
      timezone: firmProfile.timezone,
      status: firmProfile.status,
      role: member.role,
      ownerUserId: firmProfile.ownerUserId,
      coordinatorCanSeeDollars: firmProfile.coordinatorCanSeeDollars,
      createdAt: firmProfile.createdAt,
      updatedAt: firmProfile.updatedAt,
      deletedAt: firmProfile.deletedAt,
    })
    .from(member)
    .innerJoin(firmProfile, eq(firmProfile.id, member.organizationId))
    .innerJoin(organization, eq(organization.id, firmProfile.id))
}

export function makeFirmsRepo(db: Db) {
  const audit = createAuditWriter(db)

  return {
    async listMine(userId: string): Promise<FirmMembershipRow[]> {
      const rows = await baseFirmSelect(db)
        .where(
          and(
            eq(member.userId, userId),
            eq(member.status, 'active'),
            ne(firmProfile.status, 'deleted'),
            isNull(firmProfile.deletedAt),
          ),
        )
        .orderBy(desc(firmProfile.updatedAt), asc(firmProfile.name))
      return rows.map(toMembershipRow)
    },

    async findActiveForUser(
      userId: string,
      firmId: string,
    ): Promise<FirmMembershipRow | undefined> {
      const rows = await baseFirmSelect(db)
        .where(
          and(
            eq(member.userId, userId),
            eq(member.organizationId, firmId),
            eq(member.status, 'active'),
            eq(firmProfile.status, 'active'),
            isNull(firmProfile.deletedAt),
          ),
        )
        .limit(1)
      return rows[0] ? toMembershipRow(rows[0]) : undefined
    },

    async updateProfile(firmId: string, input: FirmUpdateInput): Promise<void> {
      const now = new Date()
      const patch: Partial<typeof firmProfile.$inferInsert> = {
        name: input.name,
        timezone: input.timezone,
        updatedAt: now,
      }
      if (input.coordinatorCanSeeDollars !== undefined) {
        patch.coordinatorCanSeeDollars = input.coordinatorCanSeeDollars
      }
      await Promise.all([
        db.update(firmProfile).set(patch).where(eq(firmProfile.id, firmId)),
        db.update(organization).set({ name: input.name }).where(eq(organization.id, firmId)),
      ])
    },

    async listBillingSubscriptions(firmId: string): Promise<FirmBillingSubscriptionRow[]> {
      return db
        .select({
          id: subscription.id,
          plan: subscription.plan,
          referenceId: subscription.referenceId,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          status: subscription.status,
          periodStart: subscription.periodStart,
          periodEnd: subscription.periodEnd,
          trialStart: subscription.trialStart,
          trialEnd: subscription.trialEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          cancelAt: subscription.cancelAt,
          canceledAt: subscription.canceledAt,
          endedAt: subscription.endedAt,
          seats: subscription.seats,
          billingInterval: subscription.billingInterval,
          stripeScheduleId: subscription.stripeScheduleId,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        })
        .from(subscription)
        .where(eq(subscription.referenceId, firmId))
        .orderBy(desc(subscription.createdAt))
    },

    async softDelete(firmId: string): Promise<void> {
      const now = new Date()
      await db
        .update(firmProfile)
        .set({ status: 'deleted', deletedAt: now, updatedAt: now })
        .where(eq(firmProfile.id, firmId))
    },

    async setActiveSession(
      sessionId: string,
      userId: string,
      firmId: string | null,
    ): Promise<void> {
      await db
        .update(session)
        .set({ activeOrganizationId: firmId, updatedAt: new Date() })
        .where(and(eq(session.id, sessionId), eq(session.userId, userId)))
    },

    async writeAudit(event: AuditEventInput): Promise<{ id: string }> {
      return audit.write(event)
    },
  }
}

export type FirmsRepo = ReturnType<typeof makeFirmsRepo>
