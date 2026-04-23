import { createAccessControl } from 'better-auth/plugins/access'

export const statement = {
  client: ['create', 'read', 'update', 'delete'],
  obligation: ['read', 'update:status', 'update:assignee'],
  pulse: ['read', 'approve', 'batch_apply', 'revert'],
  migration: ['run', 'revert'],
  rule: ['read', 'report_issue'],
  member: ['invite', 'suspend', 'remove', 'change_role'],
  billing: ['read', 'update'],
  audit: ['read', 'export'],
  dollars: ['read'],
} as const

export const accessControl = createAccessControl(statement)

export const roles = {
  owner: accessControl.newRole(statement),
  manager: accessControl.newRole({
    client: ['create', 'read', 'update'],
    obligation: ['read', 'update:status', 'update:assignee'],
    pulse: ['read', 'approve', 'batch_apply', 'revert'],
    migration: ['run', 'revert'],
    rule: ['read', 'report_issue'],
    member: ['invite', 'suspend', 'change_role'],
    billing: ['read'],
    audit: ['read', 'export'],
    dollars: ['read'],
  }),
  preparer: accessControl.newRole({
    client: ['create', 'read', 'update'],
    obligation: ['read', 'update:status'],
    pulse: ['read'],
    migration: ['run'],
    rule: ['read', 'report_issue'],
    audit: ['read'],
    dollars: ['read'],
  }),
  coordinator: accessControl.newRole({
    client: ['read'],
    obligation: ['read', 'update:assignee'],
    pulse: ['read'],
    rule: ['read', 'report_issue'],
    dollars: ['read'],
  }),
} as const

export type Role = 'owner' | 'manager' | 'preparer' | 'coordinator'
