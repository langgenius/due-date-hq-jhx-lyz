import type { AuditEventPublic } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { os } from '../_root'

interface AuditRow {
  id: string
  firmId: string
  actorId: string | null
  actorLabel: string | null
  entityType: string
  entityId: string
  action: string
  beforeJson: unknown
  afterJson: unknown
  reason: string | null
  ipHash: string | null
  userAgentHash: string | null
  createdAt: Date
}

export function toAuditEventPublic(row: AuditRow): AuditEventPublic {
  return {
    id: row.id,
    firmId: row.firmId,
    actorId: row.actorId,
    actorLabel: row.actorLabel,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    beforeJson: row.beforeJson ?? null,
    afterJson: row.afterJson ?? null,
    reason: row.reason,
    ipHash: row.ipHash,
    userAgentHash: row.userAgentHash,
    createdAt: row.createdAt.toISOString(),
  }
}

const list = os.audit.list.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)

  const repoInput: NonNullable<Parameters<typeof scoped.audit.list>[0]> = {}
  if (input.search !== undefined) repoInput.search = input.search
  if (input.category !== undefined) repoInput.category = input.category
  if (input.action !== undefined) repoInput.action = input.action
  if (input.actorId !== undefined) repoInput.actorId = input.actorId
  if (input.entityType !== undefined) repoInput.entityType = input.entityType
  if (input.entityId !== undefined) repoInput.entityId = input.entityId
  if (input.range !== undefined) repoInput.range = input.range
  if (input.cursor !== undefined) repoInput.cursor = input.cursor
  if (input.limit !== undefined) repoInput.limit = input.limit

  const result = await scoped.audit.list(repoInput)
  return {
    events: result.rows.map(toAuditEventPublic),
    nextCursor: result.nextCursor,
  }
})

export const auditHandlers = { list }
