import type { MemberInvitationPublic, MemberManagedRole, MemberPublic } from '@duedatehq/contracts'

export const MANAGED_ROLES = [
  'manager',
  'preparer',
  'coordinator',
] as const satisfies readonly MemberManagedRole[]

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
})

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
})

export function isManagedRole(value: unknown): value is MemberManagedRole {
  return value === 'manager' || value === 'preparer' || value === 'coordinator'
}

export function roleLabel(role: MemberPublic['role'] | MemberManagedRole): string {
  if (role === 'owner') return 'Owner'
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

export function formatMemberDate(value: string): string {
  return DATE_FORMATTER.format(new Date(value))
}

export function formatInvitationDate(value: string): string {
  return SHORT_DATE_FORMATTER.format(new Date(value))
}
