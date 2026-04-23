import type { Db } from './client'

export type { Db }

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
// depend on shape, not implementation (docs/Dev File/02 §1 layering discipline).
export interface ClientsRepo {}
export interface ObligationsRepo {}
export interface PulseRepo {}
export interface MigrationRepo {}
export interface EvidenceRepo {}
export interface AuditRepo {}
