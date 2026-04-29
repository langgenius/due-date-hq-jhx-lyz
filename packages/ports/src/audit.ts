import type { AuditActionCategory } from './shared'

export interface AuditEventInput {
  firmId: string
  actorId: string | null
  entityType: string
  entityId: string
  action: string
  before?: unknown
  after?: unknown
  reason?: string
  ipHash?: string
  userAgentHash?: string
}

export interface AuditEventRow {
  id: string
  firmId: string
  actorId: string | null
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

export interface AuditListInput {
  search?: string
  category?: AuditActionCategory
  action?: string
  actorId?: string
  entityType?: string
  entityId?: string
  range?: '24h' | '7d' | '30d' | 'all'
  cursor?: string | null
  limit?: number
}

export interface AuditListRow extends AuditEventRow {
  actorLabel: string | null
}

export interface AuditListResult {
  rows: AuditListRow[]
  nextCursor: string | null
}

export interface AuditRepo {
  readonly firmId: string
  write(event: Omit<AuditEventInput, 'firmId'>): Promise<{ id: string }>
  writeBatch(events: Array<Omit<AuditEventInput, 'firmId'>>): Promise<{ ids: string[] }>
  listByFirm(opts?: { action?: string; actorId?: string; limit?: number }): Promise<AuditEventRow[]>
  list(input?: AuditListInput): Promise<AuditListResult>
}
