import { describe, expect, it } from 'vitest'
import { updateObligationStatus } from './_service'

type ScopedRepo = import('@duedatehq/db').ScopedRepo

interface Row {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: 'pending' | 'in_progress' | 'done' | 'waiting_on_client' | 'review' | 'not_applicable'
  migrationBatchId: string | null
  createdAt: Date
  updatedAt: Date
}

function unused(name: string): never {
  throw new Error(`Unexpected repo call in updateStatus test: ${name}`)
}

function buildScoped(firmId: string, rows: Row[]) {
  const audits: Array<{
    action: string
    actorId: string | null
    entityType: string
    entityId: string
    before: unknown
    after: unknown
    reason?: string
  }> = []
  const map = new Map<string, Row>(rows.map((r) => [r.id, r]))
  let auditCounter = 0

  const obligations: ScopedRepo['obligations'] = {
    firmId,
    async createBatch() {
      throw new Error('not used')
    },
    async findById(id: string) {
      return map.get(id)
    },
    async listByClient() {
      return []
    },
    async listByBatch() {
      return []
    },
    async updateDueDate() {},
    async updateStatus(id: string, status: Row['status']) {
      const row = map.get(id)
      if (!row) throw new Error('not found')
      map.set(id, { ...row, status, updatedAt: new Date() })
    },
    async deleteByBatch() {
      return 0
    },
  }

  const audit: ScopedRepo['audit'] = {
    firmId,
    async write(event) {
      auditCounter += 1
      audits.push({
        action: event.action,
        actorId: event.actorId ?? null,
        entityType: event.entityType,
        entityId: event.entityId,
        before: event.before ?? null,
        after: event.after ?? null,
        ...(event.reason !== undefined ? { reason: event.reason } : {}),
      })
      return { id: `audit-${auditCounter}` }
    },
    async writeBatch(events) {
      const ids: string[] = []
      for (const e of events) {
        auditCounter += 1
        audits.push({
          action: e.action,
          actorId: e.actorId ?? null,
          entityType: e.entityType,
          entityId: e.entityId,
          before: e.before ?? null,
          after: e.after ?? null,
          ...(e.reason !== undefined ? { reason: e.reason } : {}),
        })
        ids.push(`audit-${auditCounter}`)
      }
      return { ids }
    },
    async listByFirm() {
      return []
    },
    async list() {
      return { rows: [], nextCursor: null }
    },
  }

  const clients: ScopedRepo['clients'] = {
    firmId,
    async create() {
      return unused('clients.create')
    },
    async createBatch() {
      return unused('clients.createBatch')
    },
    async findById() {
      return undefined
    },
    async listByFirm() {
      return []
    },
    async listByBatch() {
      return []
    },
    async softDelete() {},
    async deleteByBatch() {
      return 0
    },
  }

  const workboard: ScopedRepo['workboard'] = {
    firmId,
    async list() {
      return { rows: [], nextCursor: null }
    },
  }

  const migration = {
    firmId,
    async createBatch() {
      return unused('migration.createBatch')
    },
    async updateBatch() {
      return unused('migration.updateBatch')
    },
    async getBatch() {
      return undefined
    },
    async getActiveDraftBatch() {
      return undefined
    },
    async listByFirm() {
      return []
    },
    async listMappings() {
      return []
    },
    async listNormalizations() {
      return []
    },
    async listErrors() {
      return []
    },
    async createMappings() {
      return 0
    },
    async createNormalizations() {
      return 0
    },
    async createErrors() {
      return 0
    },
    async commitImport() {
      return unused('migration.commitImport')
    },
    async revertImport() {
      return unused('migration.revertImport')
    },
    async singleUndoImport() {
      return unused('migration.singleUndoImport')
    },
  } satisfies ScopedRepo['migration']

  const evidence: ScopedRepo['evidence'] = {
    firmId,
    async write() {
      return unused('evidence.write')
    },
    async writeBatch() {
      return unused('evidence.writeBatch')
    },
    async listByObligation() {
      return []
    },
  }

  const repo: ScopedRepo = {
    firmId,
    ai: {
      firmId,
      async recordRun() {
        return unused('ai.recordRun')
      },
    },
    clients,
    dashboard: {
      firmId,
      async load() {
        return unused('dashboard.load')
      },
    },
    obligations,
    workboard,
    pulse: {},
    migration,
    evidence,
    audit,
  }

  return { repo, audits, map }
}

const ROW_ID = '11111111-1111-4111-8111-111111111111'
const FIRM = 'firm_a'

function makeRow(over: Partial<Row> = {}): Row {
  const now = new Date('2026-04-26T00:00:00.000Z')
  return {
    id: ROW_ID,
    firmId: FIRM,
    clientId: '22222222-2222-4222-8222-222222222222',
    taxType: '1040',
    taxYear: 2026,
    baseDueDate: now,
    currentDueDate: now,
    status: 'pending',
    migrationBatchId: null,
    createdAt: now,
    updatedAt: now,
    ...over,
  }
}

describe('updateObligationStatus', () => {
  it('updates status and writes a single audit row carrying before/after', async () => {
    const { repo, audits, map } = buildScoped(FIRM, [makeRow()])

    const result = await updateObligationStatus(repo, 'user_1', {
      id: ROW_ID,
      status: 'in_progress',
      reason: 'starting today',
    })

    expect(result.obligation.status).toBe('in_progress')
    expect(result.auditId).toBe('audit-1')
    expect(map.get(ROW_ID)?.status).toBe('in_progress')

    expect(audits).toHaveLength(1)
    expect(audits[0]).toMatchObject({
      action: 'obligation.status.updated',
      actorId: 'user_1',
      entityType: 'obligation',
      entityId: ROW_ID,
      before: { status: 'pending' },
      after: { status: 'in_progress' },
      reason: 'starting today',
    })
  })

  it('is a no-op when before === after (no audit row)', async () => {
    const { repo, audits } = buildScoped(FIRM, [makeRow({ status: 'in_progress' })])

    const result = await updateObligationStatus(repo, 'user_1', {
      id: ROW_ID,
      status: 'in_progress',
    })

    expect(result.obligation.status).toBe('in_progress')
    expect(result.auditId).toBe('00000000-0000-0000-0000-000000000000')
    expect(audits).toHaveLength(0)
  })

  it('throws NOT_FOUND when the obligation does not belong to the firm', async () => {
    const { repo, audits } = buildScoped(FIRM, [])

    await expect(
      updateObligationStatus(repo, 'user_1', {
        id: ROW_ID,
        status: 'done',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    expect(audits).toHaveLength(0)
  })

  it('omits reason from audit when not provided', async () => {
    const { repo, audits } = buildScoped(FIRM, [makeRow()])

    await updateObligationStatus(repo, 'user_1', {
      id: ROW_ID,
      status: 'review',
    })

    expect(audits[0]).not.toHaveProperty('reason')
  })
})
