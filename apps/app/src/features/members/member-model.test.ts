import { describe, expect, it } from 'vitest'
import type { MemberInvitationPublic, MemberPublic } from '@duedatehq/contracts'

import {
  formatInvitationDate,
  formatMemberDate,
  invitationDescription,
  inviterName,
  isManagedRole,
  MANAGED_ROLES,
  roleLabel,
} from './member-model'

const member = {
  id: 'member_1',
  userId: 'user_1',
  name: 'Sarah Chen',
  email: 'sarah@example.com',
  image: null,
  role: 'owner',
  status: 'active',
  isCurrentUser: true,
  createdAt: '2026-04-01T12:00:00.000Z',
} satisfies MemberPublic

const invitation = {
  id: 'invite_1',
  email: 'teammate@example.com',
  role: 'manager',
  status: 'pending',
  inviterId: 'user_1',
  createdAt: '2026-04-02T12:00:00.000Z',
  expiresAt: '2026-04-09T12:00:00.000Z',
} satisfies MemberInvitationPublic

describe('member model', () => {
  it('keeps managed roles distinct from owner', () => {
    expect(MANAGED_ROLES).toEqual(['manager', 'preparer', 'coordinator'])
    expect(isManagedRole('manager')).toBe(true)
    expect(isManagedRole('owner')).toBe(false)
    expect(roleLabel('owner')).toBe('Owner')
    expect(roleLabel('coordinator')).toBe('Coordinator')
  })

  it('derives invitation copy and inviter names', () => {
    expect(invitationDescription(invitation)).toBe('Magic-link delivered · awaiting accept')
    expect(invitationDescription({ ...invitation, status: 'expired' })).toBe(
      'Link expired · ask Owner to resend',
    )
    expect(inviterName([member], 'user_1')).toBe('Sarah Chen')
    expect(inviterName([member], 'user_2')).toBe('user_2')
  })

  it('formats member and invitation dates for the members surface', () => {
    expect(formatMemberDate('2026-04-01T12:00:00.000Z')).toBe('Apr 01, 2026')
    expect(formatInvitationDate('2026-04-09T12:00:00.000Z')).toBe('Apr 09')
  })
})
