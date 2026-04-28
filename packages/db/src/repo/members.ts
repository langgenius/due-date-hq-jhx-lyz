import { and, asc, count, eq, gt } from 'drizzle-orm'
import { createAuditWriter, type AuditEventInput } from '../audit-writer'
import type { Db } from '../client'
import { invitation, member, user } from '../schema/auth'
import { firmProfile } from '../schema/firm'
import type { FirmRole } from './firms'

export type MemberStatus = 'active' | 'suspended'
export type InvitationStatus = 'pending' | 'expired'

export interface MemberRow {
  id: string
  organizationId: string
  userId: string
  name: string
  email: string
  image: string | null
  role: FirmRole
  status: MemberStatus
  createdAt: Date
}

export interface InvitationRow {
  id: string
  organizationId: string
  email: string
  role: Exclude<FirmRole, 'owner'>
  status: InvitationStatus
  inviterId: string
  expiresAt: Date
  createdAt: Date
}

export interface SeatUsage {
  activeMembers: number
  pendingInvitations: number
  usedSeats: number
  seatLimit: number
}

function normalizeRole(value: string | null): FirmRole {
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

function normalizeManagedRole(value: string | null): Exclude<FirmRole, 'owner'> {
  const role = normalizeRole(value)
  return role === 'owner' ? 'coordinator' : role
}

function normalizeStatus(value: string): MemberStatus {
  return value === 'suspended' ? 'suspended' : 'active'
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function invitationStatus(row: { status: string; expiresAt: Date }, now: Date): InvitationStatus {
  if (row.status === 'pending' && row.expiresAt <= now) return 'expired'
  return 'pending'
}

function toMemberRow(row: {
  id: string
  organizationId: string
  userId: string
  name: string
  email: string
  image: string | null
  role: string
  status: string
  createdAt: Date
}): MemberRow {
  return {
    ...row,
    role: normalizeRole(row.role),
    status: normalizeStatus(row.status),
  }
}

function toInvitationRow(
  row: {
    id: string
    organizationId: string
    email: string
    role: string | null
    status: string
    inviterId: string
    expiresAt: Date
    createdAt: Date
  },
  now: Date,
): InvitationRow {
  return {
    ...row,
    email: normalizeEmail(row.email),
    role: normalizeManagedRole(row.role),
    status: invitationStatus(row, now),
  }
}

function memberSelect(db: Db) {
  return db
    .select({
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      name: user.name,
      email: user.email,
      image: user.image,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
}

function invitationSelect(db: Db) {
  return db
    .select({
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      inviterId: invitation.inviterId,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    })
    .from(invitation)
}

async function scalarCount(query: Promise<Array<{ value: number }>>): Promise<number> {
  const [row] = await query
  return row?.value ?? 0
}

export function makeMembersRepo(db: Db) {
  const audit = createAuditWriter(db)

  async function loadSeatLimit(firmId: string): Promise<number> {
    const [row] = await db
      .select({ seatLimit: firmProfile.seatLimit })
      .from(firmProfile)
      .where(and(eq(firmProfile.id, firmId), eq(firmProfile.status, 'active')))
      .limit(1)
    return row?.seatLimit ?? 1
  }

  return {
    async listMembers(firmId: string): Promise<MemberRow[]> {
      const rows = await memberSelect(db)
        .where(eq(member.organizationId, firmId))
        .orderBy(asc(member.createdAt), asc(user.name))
      return rows.map(toMemberRow)
    },

    async listInvitations(firmId: string, now = new Date()): Promise<InvitationRow[]> {
      const rows = await invitationSelect(db)
        .where(and(eq(invitation.organizationId, firmId), eq(invitation.status, 'pending')))
        .orderBy(asc(invitation.createdAt))
      return rows.map((row) => toInvitationRow(row, now))
    },

    async findMembership(firmId: string, userId: string): Promise<MemberRow | undefined> {
      const rows = await memberSelect(db)
        .where(and(eq(member.organizationId, firmId), eq(member.userId, userId)))
        .limit(1)
      return rows[0] ? toMemberRow(rows[0]) : undefined
    },

    async findMember(firmId: string, memberId: string): Promise<MemberRow | undefined> {
      const rows = await memberSelect(db)
        .where(and(eq(member.organizationId, firmId), eq(member.id, memberId)))
        .limit(1)
      return rows[0] ? toMemberRow(rows[0]) : undefined
    },

    async findMemberByEmail(firmId: string, email: string): Promise<MemberRow | undefined> {
      const rows = await memberSelect(db)
        .where(and(eq(member.organizationId, firmId), eq(user.email, normalizeEmail(email))))
        .limit(1)
      return rows[0] ? toMemberRow(rows[0]) : undefined
    },

    async findInvitation(
      firmId: string,
      invitationId: string,
      now = new Date(),
    ): Promise<InvitationRow | undefined> {
      const rows = await invitationSelect(db)
        .where(and(eq(invitation.organizationId, firmId), eq(invitation.id, invitationId)))
        .limit(1)
      return rows[0] ? toInvitationRow(rows[0], now) : undefined
    },

    async findPendingInvitationByEmail(
      firmId: string,
      email: string,
      now = new Date(),
    ): Promise<InvitationRow | undefined> {
      const rows = await invitationSelect(db)
        .where(
          and(
            eq(invitation.organizationId, firmId),
            eq(invitation.email, normalizeEmail(email)),
            eq(invitation.status, 'pending'),
          ),
        )
        .limit(1)
      return rows[0] ? toInvitationRow(rows[0], now) : undefined
    },

    async seatLimit(firmId: string): Promise<number> {
      return loadSeatLimit(firmId)
    },

    async seatUsage(firmId: string, now = new Date()): Promise<SeatUsage> {
      const [limit, activeMembers, pendingInvitations] = await Promise.all([
        loadSeatLimit(firmId),
        scalarCount(
          db
            .select({ value: count() })
            .from(member)
            .where(and(eq(member.organizationId, firmId), eq(member.status, 'active'))),
        ),
        scalarCount(
          db
            .select({ value: count() })
            .from(invitation)
            .where(
              and(
                eq(invitation.organizationId, firmId),
                eq(invitation.status, 'pending'),
                gt(invitation.expiresAt, now),
              ),
            ),
        ),
      ])

      return {
        activeMembers,
        pendingInvitations,
        usedSeats: activeMembers + pendingInvitations,
        seatLimit: limit,
      }
    },

    async updateRole(
      firmId: string,
      memberId: string,
      role: Exclude<FirmRole, 'owner'>,
    ): Promise<void> {
      await db
        .update(member)
        .set({ role })
        .where(and(eq(member.organizationId, firmId), eq(member.id, memberId)))
    },

    async setMemberStatus(firmId: string, memberId: string, status: MemberStatus): Promise<void> {
      await db
        .update(member)
        .set({ status })
        .where(and(eq(member.organizationId, firmId), eq(member.id, memberId)))
    },

    async writeAudit(event: AuditEventInput): Promise<{ id: string }> {
      return audit.write(event)
    },
  }
}

export type MembersRepo = ReturnType<typeof makeMembersRepo>
