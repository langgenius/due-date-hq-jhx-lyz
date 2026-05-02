import { describe, expect, it } from 'vitest'
import type { ClientPublic } from '@duedatehq/contracts'
import {
  CLIENT_UNASSIGNED_OWNER_FILTER,
  buildClientFactsModel,
  filterClients,
  getClientReadiness,
} from './client-readiness'

function makeClient(overrides: Partial<ClientPublic> = {}): ClientPublic {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    firmId: 'firm_1',
    name: 'Acme LLC',
    ein: '12-3456789',
    state: 'CA',
    county: 'Alameda',
    entityType: 'llc',
    email: 'ops@example.com',
    notes: null,
    assigneeId: 'user_casey',
    assigneeName: 'Casey',
    estimatedTaxLiabilityCents: null,
    estimatedTaxLiabilitySource: null,
    equityOwnerCount: null,
    migrationBatchId: null,
    createdAt: '2026-04-29T00:00:00.000Z',
    updatedAt: '2026-04-29T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  }
}

describe('client readiness', () => {
  it('marks clients without state as needing facts', () => {
    const readiness = getClientReadiness(makeClient({ state: null }))

    expect(readiness.status).toBe('needs_facts')
    expect(readiness.missingRequiredFacts).toEqual(['state'])
  })

  it('builds summary metrics from real client rows', () => {
    const model = buildClientFactsModel([
      makeClient({ id: '1', migrationBatchId: '00000000-0000-4000-8000-000000000001' }),
      makeClient({
        id: '2',
        state: null,
        assigneeId: null,
        assigneeName: null,
        ein: null,
        email: null,
      }),
      makeClient({ id: '3', state: 'NY', migrationBatchId: null }),
    ])

    expect(model.summary).toMatchObject({
      total: 3,
      readyForRules: 2,
      needsFacts: 1,
      imported: 1,
      manual: 2,
      assigned: 2,
      statesCovered: 2,
    })
    expect(model.stateOptions).toEqual(['CA', 'NY'])
  })

  it('filters by search, entity, and state without server-only fields', () => {
    const clients = [
      makeClient({ id: '1', name: 'Harbor Advisory LLC', entityType: 'llc', state: 'CA' }),
      makeClient({ id: '2', name: 'North Trust', entityType: 'trust', state: 'NY' }),
    ]

    expect(
      filterClients(clients, {
        search: 'harbor',
        clientFilters: [],
        entityFilters: ['llc'],
        stateFilters: ['CA'],
        readinessFilters: [],
        sourceFilters: [],
        ownerFilters: [],
      }).map((client) => client.id),
    ).toEqual(['1'])
  })

  it('filters by table header facets', () => {
    const clients = [
      makeClient({
        id: '1',
        state: 'CA',
        assigneeName: 'Casey',
        migrationBatchId: '00000000-0000-4000-8000-000000000001',
      }),
      makeClient({
        id: '2',
        state: null,
        assigneeId: null,
        assigneeName: null,
        migrationBatchId: null,
      }),
    ]

    expect(
      filterClients(clients, {
        search: '',
        clientFilters: [],
        entityFilters: [],
        stateFilters: [],
        readinessFilters: ['needs_facts'],
        sourceFilters: ['manual'],
        ownerFilters: [CLIENT_UNASSIGNED_OWNER_FILTER],
      }).map((client) => client.id),
    ).toEqual(['2'])
  })
})
