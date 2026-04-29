import type { ClientCreateInput, ClientPublic } from '@duedatehq/contracts'

export const CLIENT_ENTITY_TYPES = [
  'llc',
  's_corp',
  'partnership',
  'c_corp',
  'sole_prop',
  'trust',
  'individual',
  'other',
] as const satisfies readonly ClientCreateInput['entityType'][]

export const ALL_ENTITIES = 'all'
export const CLIENT_ENTITY_FILTERS = [ALL_ENTITIES, ...CLIENT_ENTITY_TYPES] as const
export const STATE_FILTER_ALL = 'all'

export type ClientEntityType = ClientCreateInput['entityType']
export type ClientSourceType = 'imported' | 'manual'
export type ClientReadinessStatus = 'ready' | 'needs_facts'
export type RequiredClientFact = 'state' | 'entityType'
export type OptionalClientFact = 'ein' | 'owner' | 'email'

export type ClientReadiness = {
  status: ClientReadinessStatus
  missingRequiredFacts: RequiredClientFact[]
  optionalGaps: OptionalClientFact[]
}

export type ClientFactsSummary = {
  total: number
  readyForRules: number
  needsFacts: number
  imported: number
  manual: number
  assigned: number
  statesCovered: number
}

export type ClientFactsModel = {
  readinessById: Map<string, ClientReadiness>
  stateOptions: string[]
  summary: ClientFactsSummary
}

export type ClientFilters = {
  search: string
  entityFilter: string
  stateFilter: string
}

export function isClientEntityType(value: string): value is ClientEntityType {
  return CLIENT_ENTITY_TYPES.some((entityType) => entityType === value)
}

export function getClientSourceType(client: ClientPublic): ClientSourceType {
  return client.migrationBatchId ? 'imported' : 'manual'
}

export function getClientReadiness(client: ClientPublic): ClientReadiness {
  const missingRequiredFacts: RequiredClientFact[] = []
  const optionalGaps: OptionalClientFact[] = []

  if (!client.state) missingRequiredFacts.push('state')
  if (!client.entityType) missingRequiredFacts.push('entityType')
  if (!client.ein) optionalGaps.push('ein')
  if (!client.assigneeName) optionalGaps.push('owner')
  if (!client.email) optionalGaps.push('email')

  return {
    status: missingRequiredFacts.length > 0 ? 'needs_facts' : 'ready',
    missingRequiredFacts,
    optionalGaps,
  }
}

export function buildClientFactsModel(clients: ClientPublic[]): ClientFactsModel {
  const readinessById = new Map<string, ClientReadiness>()
  const states = new Set<string>()
  const summary: ClientFactsSummary = {
    total: clients.length,
    readyForRules: 0,
    needsFacts: 0,
    imported: 0,
    manual: 0,
    assigned: 0,
    statesCovered: 0,
  }

  for (const client of clients) {
    const readiness = getClientReadiness(client)
    readinessById.set(client.id, readiness)

    if (readiness.status === 'ready') summary.readyForRules += 1
    else summary.needsFacts += 1

    if (client.migrationBatchId) summary.imported += 1
    else summary.manual += 1

    if (client.assigneeName) summary.assigned += 1
    if (client.state) states.add(client.state)
  }

  const stateOptions = Array.from(states).toSorted()
  summary.statesCovered = stateOptions.length

  return {
    readinessById,
    stateOptions,
    summary,
  }
}

export function getClientSearchHaystack(client: ClientPublic): string {
  return [
    client.name,
    client.ein,
    client.state,
    client.county,
    client.entityType,
    client.email,
    client.assigneeName,
    getClientSourceType(client),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterClients(clients: ClientPublic[], filters: ClientFilters): ClientPublic[] {
  const normalizedSearch = filters.search.trim().toLowerCase()

  return clients.filter((client) => {
    if (filters.entityFilter !== ALL_ENTITIES && client.entityType !== filters.entityFilter) {
      return false
    }
    if (filters.stateFilter !== STATE_FILTER_ALL && client.state !== filters.stateFilter) {
      return false
    }
    if (normalizedSearch && !getClientSearchHaystack(client).includes(normalizedSearch)) {
      return false
    }
    return true
  })
}
