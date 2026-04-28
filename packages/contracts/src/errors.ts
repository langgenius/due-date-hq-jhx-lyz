// Custom ORPCError code table shared across packages.
// Codes enumerated in Phase 0 as procedures land; keep stable and never reuse values.

export const ErrorCodes = {
  TENANT_MISSING: 'TENANT_MISSING',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION: 'VALIDATION',
  AI_BUDGET_EXCEEDED: 'AI_BUDGET_EXCEEDED',
  GUARD_REJECTED: 'GUARD_REJECTED',
  FIRM_NOT_FOUND: 'FIRM_NOT_FOUND',
  FIRM_FORBIDDEN: 'FIRM_FORBIDDEN',
  FIRM_LIMIT_EXCEEDED: 'FIRM_LIMIT_EXCEEDED',
  FIRM_DELETED: 'FIRM_DELETED',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
