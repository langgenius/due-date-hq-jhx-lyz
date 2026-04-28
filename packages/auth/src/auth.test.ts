import { describe, expect, it } from 'vitest'
import { roles, statement } from './permissions'

describe('@duedatehq/auth permissions', () => {
  it('keeps business-domain resources on the statement', () => {
    expect(statement.client).toContain('read')
    expect(statement.audit).toContain('read')
    expect(statement.member).toContain('change_role')
  })

  // The Better Auth organization plugin checks these resources/actions from
  // its own endpoints (`organization.update`, `organization.inviteMember`,
  // `organization.cancelInvitation`, `organization.removeMember`, etc.). If
  // they go missing from our statement, even owner roles will see 403s once
  // Settings wires `organization.update` — regression-lock the shape here.
  it('includes Better Auth organization-plugin resources and actions', () => {
    expect(statement.organization).toEqual(['update', 'delete'])
    expect(statement.invitation).toEqual(['create', 'cancel'])
    expect(statement.team).toEqual(['create', 'update', 'delete'])
    expect(statement.ac).toEqual(['create', 'read', 'update', 'delete'])

    // member merges plugin defaults with our P1 lifecycle verbs.
    expect(statement.member).toEqual(
      expect.arrayContaining([
        'create',
        'update',
        'delete',
        'invite',
        'suspend',
        'remove',
        'change_role',
      ]),
    )
  })

  it('declares every configured role', () => {
    expect(Object.keys(roles).toSorted()).toEqual(
      ['coordinator', 'manager', 'owner', 'preparer'].toSorted(),
    )
  })

  it('hides dollars:read from the coordinator role (PRD §3.6 RBAC)', () => {
    const coord = roles.coordinator.statements as Record<string, readonly string[] | undefined>
    expect(coord.dollars).toBeUndefined()
  })

  it('allows owner and manager to revert Pulse and migration batches', () => {
    const manager = roles.manager.statements as Record<string, readonly string[] | undefined>
    const owner = roles.owner.statements as Record<string, readonly string[]>

    expect(manager.pulse).toEqual(
      expect.arrayContaining(['read', 'approve', 'batch_apply', 'revert']),
    )
    expect(manager.migration).toEqual(expect.arrayContaining(['run', 'revert']))
    expect(owner.pulse).toContain('revert')
    expect(owner.migration).toContain('revert')
  })

  it('grants owner the full member/organization/invitation surface', () => {
    const owner = roles.owner.statements as Record<string, readonly string[]>
    expect(owner.organization).toEqual(expect.arrayContaining(['update', 'delete']))
    expect(owner.invitation).toEqual(expect.arrayContaining(['create', 'cancel']))
    expect(owner.member).toEqual(expect.arrayContaining(['create', 'update', 'delete']))
  })

  it('keeps member administration owner-only for Members v1', () => {
    const manager = roles.manager.statements as Record<string, readonly string[] | undefined>
    expect(manager.member).toBeUndefined()
    expect(manager.invitation).toBeUndefined()
  })
})
