import type { Db } from './client'
import type { AiRepo as RealAiRepo } from './repo/ai'
import type { AuditRepo as RealAuditRepo } from './repo/audit'
import type { ClientsRepo as RealClientsRepo } from './repo/clients'
import type { DashboardRepo as RealDashboardRepo } from './repo/dashboard'
import type { EvidenceRepo as RealEvidenceRepo } from './repo/evidence'
import type {
  FirmMembershipRow as RealFirmMembershipRow,
  FirmsRepo as RealFirmsRepo,
} from './repo/firms'
import type { MigrationRepo as RealMigrationRepo } from './repo/migration'
import type {
  InvitationRow as RealInvitationRow,
  MemberRow as RealMemberRow,
  MembersRepo as RealMembersRepo,
  SeatUsage as RealSeatUsage,
} from './repo/members'
import type { ObligationsRepo as RealObligationsRepo } from './repo/obligations'
import type { WorkboardRepo as RealWorkboardRepo } from './repo/workboard'
import type { FirmProfile } from './schema/firm'

export type { Db }
export type { FirmProfile, NewFirmProfile } from './schema/firm'
export type FirmsRepo = RealFirmsRepo
export type FirmMembershipRow = RealFirmMembershipRow
export type MembersRepo = RealMembersRepo
export type MemberRow = RealMemberRow
export type InvitationRow = RealInvitationRow
export type SeatUsage = RealSeatUsage

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
  readonly ai: AiRepo
  readonly clients: ClientsRepo
  readonly dashboard: DashboardRepo
  readonly obligations: ObligationsRepo
  readonly workboard: WorkboardRepo
  readonly pulse: PulseRepo
  readonly migration: MigrationRepo
  readonly evidence: EvidenceRepo
  readonly audit: AuditRepo
}

export type AiRepo = RealAiRepo
export type ClientsRepo = RealClientsRepo
export type DashboardRepo = RealDashboardRepo
export type ObligationsRepo = RealObligationsRepo
export type WorkboardRepo = RealWorkboardRepo
export interface PulseRepo {}
export type MigrationRepo = RealMigrationRepo
export type EvidenceRepo = RealEvidenceRepo
export type AuditRepo = RealAuditRepo
