import { describe, expect, it, vi } from 'vitest'
import type { Db } from '../client'
import { makeWorkboardRepo } from './workboard'

interface FakeRow {
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
  clientName: string
}

/**
 * Fake Drizzle chain — only what makeWorkboardRepo.list calls actually walks.
 * Order: select().from().innerJoin().where().orderBy().limit() => Promise<rows>.
 */
function createFakeDb(rows: FakeRow[]) {
  const limit = vi.fn(async (_n: number) => rows)
  const orderBy = vi.fn(() => ({ limit }))
  const where = vi.fn(() => ({ orderBy }))
  const innerJoin = vi.fn(() => ({ where }))
  const from = vi.fn(() => ({ innerJoin }))
  const select = vi.fn(() => ({ from }))

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- focused Drizzle test double.
    db: { select } as unknown as Db,
    select,
    where,
    orderBy,
    limit,
  }
}

function makeRow(over: Partial<FakeRow> = {}): FakeRow {
  const id = over.id ?? '11111111-1111-4111-8111-111111111111'
  const due = over.currentDueDate ?? new Date('2026-04-15T00:00:00.000Z')
  return {
    id,
    firmId: over.firmId ?? 'firm_a',
    clientId: over.clientId ?? '22222222-2222-4222-8222-222222222222',
    taxType: over.taxType ?? '1040',
    taxYear: over.taxYear ?? 2026,
    baseDueDate: over.baseDueDate ?? due,
    currentDueDate: due,
    status: over.status ?? 'pending',
    migrationBatchId: over.migrationBatchId ?? null,
    createdAt: over.createdAt ?? due,
    updatedAt: over.updatedAt ?? due,
    clientName: over.clientName ?? 'Acme Holdings LLC',
  }
}

describe('makeWorkboardRepo.list', () => {
  it('returns rows with no nextCursor when limit is not exceeded', async () => {
    const fake = createFakeDb([makeRow({ id: 'a' }), makeRow({ id: 'b' })])
    const repo = makeWorkboardRepo(fake.db, 'firm_a')

    const result = await repo.list({ limit: 50 })

    expect(result.rows).toHaveLength(2)
    expect(result.nextCursor).toBeNull()
    expect(fake.limit).toHaveBeenCalledWith(51)
  })

  it('emits nextCursor when more rows exist (sentinel detection)', async () => {
    const rows: FakeRow[] = []
    for (let i = 0; i < 6; i += 1) {
      rows.push(
        makeRow({
          id: `0000000${i}-0000-4000-8000-000000000000`,
          currentDueDate: new Date(`2026-04-${10 + i}T00:00:00.000Z`),
        }),
      )
    }
    const fake = createFakeDb(rows)
    const repo = makeWorkboardRepo(fake.db, 'firm_a')

    const result = await repo.list({ limit: 5, sort: 'due_asc' })

    expect(result.rows).toHaveLength(5)
    expect(result.nextCursor).not.toBeNull()
    expect(typeof result.nextCursor).toBe('string')
  })

  it('does not emit nextCursor for updated_desc sort (no keyset on updatedAt)', async () => {
    const rows: FakeRow[] = []
    for (let i = 0; i < 6; i += 1) {
      rows.push(makeRow({ id: `id_${i}`, updatedAt: new Date(2026, 3, 10 + i) }))
    }
    const fake = createFakeDb(rows)
    const repo = makeWorkboardRepo(fake.db, 'firm_a')

    const result = await repo.list({ limit: 5, sort: 'updated_desc' })

    expect(result.rows).toHaveLength(5)
    expect(result.nextCursor).toBeNull()
  })

  it('clamps limit between 1 and 100', async () => {
    const fake = createFakeDb([])
    const repo = makeWorkboardRepo(fake.db, 'firm_a')

    await repo.list({ limit: 9999 })
    expect(fake.limit).toHaveBeenLastCalledWith(101)

    await repo.list({ limit: 0 })
    expect(fake.limit).toHaveBeenLastCalledWith(2)
  })

  it('decodes invalid cursor gracefully (treats as no cursor)', async () => {
    const fake = createFakeDb([])
    const repo = makeWorkboardRepo(fake.db, 'firm_a')

    await expect(repo.list({ cursor: '!!!not-base64!!!' })).resolves.toEqual({
      rows: [],
      nextCursor: null,
    })
  })
})
