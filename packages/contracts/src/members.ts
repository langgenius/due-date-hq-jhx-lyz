import { oc } from '@orpc/contract'
import * as z from 'zod'
import { FirmRoleSchema } from './firms'

export const MemberManagedRoleSchema = z.enum(['partner', 'manager', 'preparer', 'coordinator'])
export const MemberStatusSchema = z.enum(['active', 'suspended'])
export const MemberInvitationStatusSchema = z.enum(['pending', 'expired', 'canceled'])

export const MemberPublicSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  image: z.string().nullable(),
  role: FirmRoleSchema,
  status: MemberStatusSchema,
  isCurrentUser: z.boolean(),
  createdAt: z.iso.datetime(),
})

export const MemberInvitationPublicSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  role: MemberManagedRoleSchema,
  status: MemberInvitationStatusSchema,
  inviterId: z.string().min(1),
  expiresAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export const MembersListOutputSchema = z.object({
  seatLimit: z.number().int().min(1),
  usedSeats: z.number().int().min(0),
  availableSeats: z.number().int().min(0),
  members: z.array(MemberPublicSchema),
  invitations: z.array(MemberInvitationPublicSchema),
})

export const MemberAssigneeOptionSchema = z.object({
  assigneeId: z.string().min(1),
  memberId: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  role: FirmRoleSchema,
})

export const MemberInviteInputSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: MemberManagedRoleSchema,
})

export const MemberInvitationIdInputSchema = z.object({
  invitationId: z.string().min(1),
})

export const MemberIdInputSchema = z.object({
  memberId: z.string().min(1),
})

export const MemberUpdateRoleInputSchema = z.object({
  memberId: z.string().min(1),
  role: MemberManagedRoleSchema,
})

export const membersContract = oc.router({
  listCurrent: oc.input(z.undefined()).output(MembersListOutputSchema),
  listAssignable: oc.input(z.undefined()).output(z.array(MemberAssigneeOptionSchema)),
  invite: oc.input(MemberInviteInputSchema).output(MembersListOutputSchema),
  cancelInvitation: oc.input(MemberInvitationIdInputSchema).output(MembersListOutputSchema),
  resendInvitation: oc.input(MemberInvitationIdInputSchema).output(MembersListOutputSchema),
  updateRole: oc.input(MemberUpdateRoleInputSchema).output(MembersListOutputSchema),
  suspend: oc.input(MemberIdInputSchema).output(MembersListOutputSchema),
  reactivate: oc.input(MemberIdInputSchema).output(MembersListOutputSchema),
  remove: oc.input(MemberIdInputSchema).output(MembersListOutputSchema),
})

export type MemberInvitationPublic = z.infer<typeof MemberInvitationPublicSchema>
export type MemberInvitationStatus = z.infer<typeof MemberInvitationStatusSchema>
export type MemberAssigneeOption = z.infer<typeof MemberAssigneeOptionSchema>
export type MemberInviteInput = z.infer<typeof MemberInviteInputSchema>
export type MemberManagedRole = z.infer<typeof MemberManagedRoleSchema>
export type MemberPublic = z.infer<typeof MemberPublicSchema>
export type MembersContract = typeof membersContract
export type MembersListOutput = z.infer<typeof MembersListOutputSchema>
export type MemberStatus = z.infer<typeof MemberStatusSchema>
