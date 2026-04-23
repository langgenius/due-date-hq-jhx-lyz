// Access Control statements and four-role matrix (docs/Dev File/06 §3).
// Phase 1 flips enforcement on for Manager/Preparer/Coordinator; Phase 0 only enforces Owner boundaries.

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

export type Role = 'owner' | 'manager' | 'preparer' | 'coordinator'
