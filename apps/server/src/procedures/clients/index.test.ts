import { describe, expect, it, vi } from 'vitest'
import type { ClientRow } from './_serializers'
import { rereadCreatedClientBatch } from './index'

function makeClient(overrides: Partial<ClientRow> = {}): ClientRow {
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
    estimatedTaxLiabilityCents: overrides.estimatedTaxLiabilityCents ?? null,
    estimatedTaxLiabilitySource: overrides.estimatedTaxLiabilitySource ?? null,
    equityOwnerCount: overrides.equityOwnerCount ?? null,
    migrationBatchId: overrides.migrationBatchId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
  }
}

describe('clients procedure batch reread', () => {
  it('uses targeted client lookup for the created ids', async () => {
    const findManyByIds = vi.fn(async () => [makeClient({ id: 'client_1' })])

    const rows = await rereadCreatedClientBatch({ findManyByIds }, ['client_1'])

    expect(findManyByIds).toHaveBeenCalledWith(['client_1'])
    expect(rows.map((row) => row.id)).toEqual(['client_1'])
  })

  it('fails closed if a created row cannot be re-read', async () => {
    const findManyByIds = vi.fn(async () => [makeClient({ id: 'client_1' })])

    await expect(
      rereadCreatedClientBatch({ findManyByIds }, ['client_1', 'client_2']),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    })
  })
})
