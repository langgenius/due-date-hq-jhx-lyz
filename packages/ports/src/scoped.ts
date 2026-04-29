import type { AiRepo } from './ai'
import type { AuditRepo } from './audit'
import type { ClientsRepo } from './clients'
import type { DashboardRepo } from './dashboard'
import type { EvidenceRepo } from './evidence'
import type { MigrationRepo } from './migration'
import type { ObligationsRepo } from './obligations'
import type { PulseRepo } from './pulse'
import type { WorkboardRepo } from './workboard'
import type { WorkloadRepo } from './workload'

export interface ScopedRepo {
  readonly firmId: string
  readonly ai: AiRepo
  readonly clients: ClientsRepo
  readonly dashboard: DashboardRepo
  readonly obligations: ObligationsRepo
  readonly workboard: WorkboardRepo
  readonly workload: WorkloadRepo
  readonly pulse: PulseRepo
  readonly migration: MigrationRepo
  readonly evidence: EvidenceRepo
  readonly audit: AuditRepo
}
