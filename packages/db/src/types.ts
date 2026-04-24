import type { Db } from './client'
import type { FirmProfile } from './schema/firm'

export type { Db }
export type { FirmProfile, NewFirmProfile } from './schema/firm'

/**
 * TenantContext — the resolved business-tenant view for the current request.
 *
 * Composed by `apps/server/src/middleware/tenant.ts` from
 * `session.activeOrganizationId` + `firm_profile` row. Procedures read this
 * via `c.var.tenantContext` to gate behavior on `plan` / `seatLimit` /
 * `status` without re-querying.
 *
 * The `scoped(db, firmId)` repo factory is intentionally NOT changed in this
 * iteration — the repo Proxies still throw "not implemented" and no caller
 * needs `tenant.plan` yet. Signature merging happens with the first real repo.
 * See plan §2 and ADR 0010 Follow-ups.
 */
export interface TenantContext {
  readonly firmId: string // = organization.id = firm_profile.id
  readonly plan: FirmProfile['plan']
  readonly seatLimit: number
  readonly timezone: string
  readonly status: FirmProfile['status']
  readonly ownerUserId: string
}

// ScopedRepo is the only handle procedures receive. Every tenant-scoped query
// inside the factory hard-codes `WHERE firm_id = :firmId`; see `scoped.ts`.
export interface ScopedRepo {
  readonly firmId: string
  readonly clients: ClientsRepo
  readonly obligations: ObligationsRepo
  readonly pulse: PulseRepo
  readonly migration: MigrationRepo
  readonly evidence: EvidenceRepo
  readonly audit: AuditRepo
}

// Per-domain repo contracts are filled in Phase 0. Keep interfaces here so consumers
// depend on shape, not implementation (docs/dev-file/02 §1 layering discipline).
export interface ClientsRepo {}
export interface ObligationsRepo {}
export interface PulseRepo {}
export interface MigrationRepo {}
export interface EvidenceRepo {}
export interface AuditRepo {}
