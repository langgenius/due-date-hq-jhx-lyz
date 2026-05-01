import { ORPCError } from '@orpc/server'
import {
  ErrorCodes,
  type MemberAssigneeOption,
  type MemberInvitationPublic,
  type MemberPublic,
  type MembersListOutput,
} from '@duedatehq/contracts'
import { createWorkerAuth } from '../../auth'
import type { ContextVars } from '../../env'
import type { RpcContext } from '../_context'
import {
  CLIENT_WRITE_ROLES,
  requireCurrentFirmOwner,
  requireCurrentFirmRole,
} from '../_permissions'
import { os } from '../_root'

type MembersRepo = NonNullable<ContextVars['members']>
type MemberRow = NonNullable<Awaited<ReturnType<MembersRepo['findMember']>>>
type InvitationRow = NonNullable<Awaited<ReturnType<MembersRepo['findInvitation']>>>
type OrpcAuthErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT'

function toIso(value: Date): string {
  return value.toISOString()
}

function toMemberPublic(row: MemberRow, currentUserId: string): MemberPublic {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    status: row.status,
    isCurrentUser: row.userId === currentUserId,
    createdAt: toIso(row.createdAt),
  }
}

function toMemberAssigneeOption(row: MemberRow): MemberAssigneeOption {
  return {
    assigneeId: row.userId,
    memberId: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  }
}

function toInvitationPublic(row: InvitationRow): MemberInvitationPublic {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    inviterId: row.inviterId,
    expiresAt: toIso(row.expiresAt),
    createdAt: toIso(row.createdAt),
  }
}

async function listOutput(input: {
  members: MembersRepo
  firmId: string
  userId: string
}): Promise<MembersListOutput> {
  const now = new Date()
  const [members, invitations, usage] = await Promise.all([
    input.members.listMembers(input.firmId),
    input.members.listInvitations(input.firmId, now),
    input.members.seatUsage(input.firmId, now),
  ])

  return {
    seatLimit: usage.seatLimit,
    usedSeats: usage.usedSeats,
    availableSeats: Math.max(usage.seatLimit - usage.usedSeats, 0),
    members: members.map((member) => toMemberPublic(member, input.userId)),
    invitations: invitations.map(toInvitationPublic),
  }
}

function requireMutableTarget(target: MemberRow, userId: string): void {
  if (target.userId === userId) {
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.MEMBER_SELF_ACTION_FORBIDDEN })
  }
  if (target.role === 'owner') {
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.MEMBER_OWNER_ACTION_FORBIDDEN })
  }
}

async function requireTargetMember(input: {
  members: MembersRepo
  firmId: string
  memberId: string
}): Promise<MemberRow> {
  const target = await input.members.findMember(input.firmId, input.memberId)
  if (!target) {
    throw new ORPCError('NOT_FOUND', { message: ErrorCodes.MEMBER_NOT_FOUND })
  }
  return target
}

async function requireInvitation(input: {
  members: MembersRepo
  firmId: string
  invitationId: string
}): Promise<InvitationRow> {
  const invitation = await input.members.findInvitation(input.firmId, input.invitationId)
  if (!invitation) {
    throw new ORPCError('NOT_FOUND', { message: ErrorCodes.INVITATION_NOT_FOUND })
  }
  return invitation
}

async function ensureInviteAvailable(input: {
  members: MembersRepo
  firmId: string
  email: string
}): Promise<void> {
  const existingMember = await input.members.findMemberByEmail(input.firmId, input.email)
  if (existingMember) {
    throw new ORPCError('CONFLICT', { message: ErrorCodes.MEMBER_DUPLICATE })
  }

  const existingInvitation = await input.members.findPendingInvitationByEmail(
    input.firmId,
    input.email,
  )
  if (existingInvitation?.status === 'pending') {
    throw new ORPCError('CONFLICT', { message: ErrorCodes.INVITATION_DUPLICATE })
  }

  const usage = await input.members.seatUsage(input.firmId)
  if (usage.usedSeats >= usage.seatLimit) {
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.MEMBER_SEAT_LIMIT })
  }
}

async function ensureSeatForResend(input: {
  members: MembersRepo
  firmId: string
  invitation: InvitationRow
}): Promise<void> {
  if (input.invitation.status === 'pending') return
  const usage = await input.members.seatUsage(input.firmId)
  if (usage.usedSeats >= usage.seatLimit) {
    throw new ORPCError('FORBIDDEN', { message: ErrorCodes.MEMBER_SEAT_LIMIT })
  }
}

function authErrorStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null
  const status = 'status' in err ? err.status : undefined
  const statusCode = 'statusCode' in err ? err.statusCode : undefined
  if (typeof status === 'number') return status
  if (typeof statusCode === 'number') return statusCode
  return null
}

function authErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : ErrorCodes.MEMBER_FORBIDDEN
}

function mapAuthErrorCode(status: number | null): OrpcAuthErrorCode {
  if (status === 400) return 'BAD_REQUEST'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  return 'FORBIDDEN'
}

async function callAuthApi<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (err) {
    if (err instanceof ORPCError) throw err
    const status = authErrorStatus(err)
    if (status && status < 500) {
      throw new ORPCError(mapAuthErrorCode(status), { message: authErrorMessage(err) })
    }
    throw err
  }
}

const listCurrent = os.members.listCurrent.handler(async ({ context }) => {
  const { members, tenant, userId } = await requireCurrentFirmOwner(context)
  return listOutput({ members, firmId: tenant.firmId, userId })
})

const listAssignable = os.members.listAssignable.handler(async ({ context }) => {
  const { members, tenant } = await requireCurrentFirmRole(context, CLIENT_WRITE_ROLES)
  const rows = await members.listMembers(tenant.firmId)
  return rows.filter((member) => member.status === 'active').map(toMemberAssigneeOption)
})

const invite = os.members.invite.handler(async ({ input, context }) => {
  const { members, tenant, userId } = await requireCurrentFirmOwner(context)
  await ensureInviteAvailable({ members, firmId: tenant.firmId, email: input.email })

  const auth = createWorkerAuth(context.env)
  const invitation = await callAuthApi(
    auth.api.createInvitation({
      body: {
        email: input.email,
        role: input.role,
        organizationId: tenant.firmId,
      },
      headers: context.request.headers,
    }),
  )

  await members.writeAudit({
    firmId: tenant.firmId,
    actorId: userId,
    entityType: 'member_invitation',
    entityId: invitation.id,
    action: 'member.invited',
    after: { email: input.email, role: input.role },
  })

  return listOutput({ members, firmId: tenant.firmId, userId })
})

const cancelInvitation = os.members.cancelInvitation.handler(async ({ input, context }) => {
  const { members, tenant, userId } = await requireCurrentFirmOwner(context)
  const invitation = await requireInvitation({
    members,
    firmId: tenant.firmId,
    invitationId: input.invitationId,
  })
  const auth = createWorkerAuth(context.env)
  await callAuthApi(
    auth.api.cancelInvitation({
      body: { invitationId: input.invitationId },
      headers: context.request.headers,
    }),
  )

  await members.writeAudit({
    firmId: tenant.firmId,
    actorId: userId,
    entityType: 'member_invitation',
    entityId: input.invitationId,
    action: 'member.invitation.canceled',
    before: { email: invitation.email, role: invitation.role, status: invitation.status },
  })

  return listOutput({ members, firmId: tenant.firmId, userId })
})

const resendInvitation = os.members.resendInvitation.handler(async ({ input, context }) => {
  const { members, tenant, userId } = await requireCurrentFirmOwner(context)
  const invitation = await requireInvitation({
    members,
    firmId: tenant.firmId,
    invitationId: input.invitationId,
  })
  await ensureSeatForResend({ members, firmId: tenant.firmId, invitation })

  const auth = createWorkerAuth(context.env)
  const next = await callAuthApi(
    auth.api.createInvitation({
      body: {
        email: invitation.email,
        role: invitation.role,
        organizationId: tenant.firmId,
        resend: true,
      },
      headers: context.request.headers,
    }),
  )

  await members.writeAudit({
    firmId: tenant.firmId,
    actorId: userId,
    entityType: 'member_invitation',
    entityId: next.id,
    action: 'member.invitation.resent',
    before: { invitationId: invitation.id, status: invitation.status },
    after: { email: invitation.email, role: invitation.role },
  })

  return listOutput({ members, firmId: tenant.firmId, userId })
})

const updateRole = os.members.updateRole.handler(async ({ input, context }) => {
  const { members, tenant, userId } = await requireCurrentFirmOwner(context)
  const target = await requireTargetMember({
    members,
    firmId: tenant.firmId,
    memberId: input.memberId,
  })
  requireMutableTarget(target, userId)

  const auth = createWorkerAuth(context.env)
  await callAuthApi(
    auth.api.updateMemberRole({
      body: {
        memberId: input.memberId,
        role: input.role,
        organizationId: tenant.firmId,
      },
      headers: context.request.headers,
    }),
  )

  await members.writeAudit({
    firmId: tenant.firmId,
    actorId: userId,
    entityType: 'member',
    entityId: input.memberId,
    action: 'member.role.updated',
    before: { role: target.role },
    after: { role: input.role },
  })

  return listOutput({ members, firmId: tenant.firmId, userId })
})

async function setStatus(input: {
  context: RpcContext
  memberId: string
  status: 'active' | 'suspended'
  action: 'member.reactivated' | 'member.suspended'
}) {
  const { members, tenant, userId } = await requireCurrentFirmOwner(input.context)
  const target = await requireTargetMember({
    members,
    firmId: tenant.firmId,
    memberId: input.memberId,
  })
  requireMutableTarget(target, userId)

  await members.setMemberStatus(tenant.firmId, input.memberId, input.status)
  await members.writeAudit({
    firmId: tenant.firmId,
    actorId: userId,
    entityType: 'member',
    entityId: input.memberId,
    action: input.action,
    before: { status: target.status },
    after: { status: input.status },
  })

  return listOutput({ members, firmId: tenant.firmId, userId })
}

const suspend = os.members.suspend.handler(async ({ input, context }) =>
  setStatus({
    context,
    memberId: input.memberId,
    status: 'suspended',
    action: 'member.suspended',
  }),
)

const reactivate = os.members.reactivate.handler(async ({ input, context }) =>
  setStatus({
    context,
    memberId: input.memberId,
    status: 'active',
    action: 'member.reactivated',
  }),
)

const remove = os.members.remove.handler(async ({ input, context }) => {
  const { members, tenant, userId } = await requireCurrentFirmOwner(context)
  const target = await requireTargetMember({
    members,
    firmId: tenant.firmId,
    memberId: input.memberId,
  })
  requireMutableTarget(target, userId)

  const auth = createWorkerAuth(context.env)
  await callAuthApi(
    auth.api.removeMember({
      body: {
        memberIdOrEmail: input.memberId,
        organizationId: tenant.firmId,
      },
      headers: context.request.headers,
    }),
  )

  await members.writeAudit({
    firmId: tenant.firmId,
    actorId: userId,
    entityType: 'member',
    entityId: input.memberId,
    action: 'member.removed',
    before: { email: target.email, role: target.role, status: target.status },
  })

  return listOutput({ members, firmId: tenant.firmId, userId })
})

export const membersHandlers = {
  listCurrent,
  listAssignable,
  invite,
  cancelInvitation,
  resendInvitation,
  updateRole,
  suspend,
  reactivate,
  remove,
}
