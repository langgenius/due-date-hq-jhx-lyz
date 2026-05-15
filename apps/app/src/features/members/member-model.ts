import type { MemberInvitationPublic, MemberManagedRole, MemberPublic } from '@duedatehq/contracts'
import { formatDateTimeWithTimezone } from '@/lib/utils'

export const MANAGED_ROLES = [
  'partner',
  'manager',
  'preparer',
  'coordinator',
] as const satisfies readonly MemberManagedRole[]

export function isManagedRole(value: unknown): value is MemberManagedRole {
  return (
    value === 'partner' || value === 'manager' || value === 'preparer' || value === 'coordinator'
  )
}

export function roleLabel(role: MemberPublic['role'] | MemberManagedRole): string {
  if (role === 'owner') return 'Owner'
  if (role === 'partner') return 'Partner'
  if (role === 'manager') return 'Manager'
  if (role === 'preparer') return 'Preparer'
  return 'Coordinator'
}

export function invitationDescription(invitation: MemberInvitationPublic): string {
  if (invitation.status === 'expired') return 'Link expired · ask Owner to resend'
  return 'Magic-link delivered · awaiting accept'
}

export function inviterName(members: MemberPublic[], inviterId: string): string {
  return members.find((member) => member.userId === inviterId)?.name ?? inviterId
}

export function formatMemberDate(value: string, timeZone: string): string {
  return formatDateTimeWithTimezone(value, timeZone)
}

export function formatInvitationDate(value: string, timeZone: string): string {
  return formatDateTimeWithTimezone(value, timeZone)
}
