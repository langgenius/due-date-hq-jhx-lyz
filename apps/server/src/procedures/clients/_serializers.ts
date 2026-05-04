import type { ClientFilingProfilePublic, ClientPublic } from '@duedatehq/contracts'

/**
 * Drizzle row → contract schema serializer for `client`.
 *
 * Date columns are stored as `Date` objects in the repo layer; the contract
 * expects ISO-8601 strings. We centralise the conversion here so handlers
 * stay thin.
 */

export interface ClientRow {
  id: string
  firmId: string
  name: string
  ein: string | null
  state: string | null
  county: string | null
  entityType:
    | 'llc'
    | 's_corp'
    | 'partnership'
    | 'c_corp'
    | 'sole_prop'
    | 'trust'
    | 'individual'
    | 'other'
  email: string | null
  notes: string | null
  assigneeId: string | null
  assigneeName: string | null
  importanceWeight: number
  lateFilingCountLast12mo: number
  estimatedTaxLiabilityCents: number | null
  estimatedTaxLiabilitySource: 'manual' | 'imported' | 'demo_seed' | null
  equityOwnerCount: number | null
  migrationBatchId: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ClientCreateInputForRepo {
  id?: string
  name: string
  ein?: string | null
  state?: string | null
  county?: string | null
  entityType: ClientRow['entityType']
  email?: string | null
  notes?: string | null
  assigneeId?: string | null
  assigneeName?: string | null
  importanceWeight?: number
  lateFilingCountLast12mo?: number
  estimatedTaxLiabilityCents?: number | null
  estimatedTaxLiabilitySource?: 'manual' | 'imported' | 'demo_seed' | null
  equityOwnerCount?: number | null
  migrationBatchId?: string | null
}

export interface ClientFilingProfileRow {
  id: string
  firmId: string
  clientId: string
  state: string
  counties: string[]
  taxTypes: string[]
  isPrimary: boolean
  source: ClientFilingProfilePublic['source']
  migrationBatchId: string | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function toClientFilingProfilePublic(row: ClientFilingProfileRow): ClientFilingProfilePublic {
  return {
    id: row.id,
    firmId: row.firmId,
    clientId: row.clientId,
    state: row.state,
    counties: row.counties,
    taxTypes: row.taxTypes,
    isPrimary: row.isPrimary,
    source: row.source,
    migrationBatchId: row.migrationBatchId,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function toClientPublic(
  row: ClientRow,
  opts: { hideDollars?: boolean; filingProfiles?: ClientFilingProfileRow[] } = {},
): ClientPublic {
  return {
    id: row.id,
    firmId: row.firmId,
    name: row.name,
    ein: row.ein,
    state: row.state,
    county: row.county,
    entityType: row.entityType,
    email: row.email,
    notes: row.notes,
    assigneeId: row.assigneeId,
    assigneeName: row.assigneeName,
    importanceWeight: row.importanceWeight,
    lateFilingCountLast12mo: row.lateFilingCountLast12mo,
    estimatedTaxLiabilityCents: opts.hideDollars ? null : row.estimatedTaxLiabilityCents,
    estimatedTaxLiabilitySource: opts.hideDollars ? null : row.estimatedTaxLiabilitySource,
    equityOwnerCount: row.equityOwnerCount,
    migrationBatchId: row.migrationBatchId,
    filingProfiles: (opts.filingProfiles ?? []).map(toClientFilingProfilePublic),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}
