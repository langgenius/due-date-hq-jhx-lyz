import { describe, expect, it, vi } from 'vitest'
import type { Db } from '../client'
import type { Client } from '../schema/clients'
import { makeClientsRepo } from './clients'

function createFakeDb(selectResponses: Client[][]) {
  const where = vi.fn(async () => selectResponses.shift() ?? [])
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- focused Drizzle test double.
    db: { select } as unknown as Db,
    select,
    where,
  }
}

function makeClient(overrides: Partial<Client> = {}): Client {
  const now = new Date('2026-04-29T00:00:00.000Z')
  return {
    id: overrides.id ?? 'client_1',
    firmId: overrides.firmId ?? 'firm_1',
    name: overrides.name ?? 'Acme LLC',
    ein: overrides.ein ?? null,
    state: overrides.state ?? null,
    county: overrides.county ?? null,
    entityType: overrides.entityType ?? 'llc',
    email: overrides.email ?? null,
    notes: overrides.notes ?? null,
    assigneeName: overrides.assigneeName ?? null,
    migrationBatchId: overrides.migrationBatchId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
  }
}

describe('makeClientsRepo.findManyByIds', () => {
  it('returns early without querying for an empty id list', async () => {
    const fake = createFakeDb([])
    const repo = makeClientsRepo(fake.db, 'firm_1')

    await expect(repo.findManyByIds([])).resolves.toEqual([])

    expect(fake.select).not.toHaveBeenCalled()
  })

  it('queries by bounded id chunks and preserves requested id order', async () => {
    const ids = Array.from({ length: 101 }, (_, index) => `client_${index}`)
    const fake = createFakeDb([
      [makeClient({ id: 'client_98' }), makeClient({ id: 'client_0' })],
      [makeClient({ id: 'client_100' }), makeClient({ id: 'client_99' })],
    ])
    const repo = makeClientsRepo(fake.db, 'firm_1')

    const rows = await repo.findManyByIds(ids)

    expect(fake.select).toHaveBeenCalledTimes(2)
    expect(fake.where).toHaveBeenCalledTimes(2)
    expect(rows.map((row) => row.id)).toEqual(['client_0', 'client_98', 'client_99', 'client_100'])
  })
})
