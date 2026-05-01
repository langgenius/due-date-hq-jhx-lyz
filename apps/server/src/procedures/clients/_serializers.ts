import type { ClientPublic } from '@duedatehq/contracts'

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
  estimatedTaxLiabilityCents?: number | null
  estimatedTaxLiabilitySource?: 'manual' | 'imported' | 'demo_seed' | null
  equityOwnerCount?: number | null
  migrationBatchId?: string | null
}

export function toClientPublic(row: ClientRow, opts: { hideDollars?: boolean } = {}): ClientPublic {
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
    estimatedTaxLiabilityCents: opts.hideDollars ? null : row.estimatedTaxLiabilityCents,
    estimatedTaxLiabilitySource: opts.hideDollars ? null : row.estimatedTaxLiabilitySource,
    equityOwnerCount: row.equityOwnerCount,
    migrationBatchId: row.migrationBatchId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}
