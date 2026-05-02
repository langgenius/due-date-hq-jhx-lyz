import type { AiRepo } from './ai'
import type { AuditRepo } from './audit'
import type { ClientsRepo } from './clients'
import type { DashboardRepo } from './dashboard'
import type { EvidenceRepo } from './evidence'
import type { MigrationRepo } from './migration'
import type { NotificationsRepo } from './notifications'
import type { ObligationsRepo } from './obligations'
import type { PulseRepo } from './pulse'
import type { ReadinessRepo } from './readiness'
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
  readonly readiness: ReadinessRepo
  readonly migration: MigrationRepo
  readonly notifications?: NotificationsRepo
  readonly evidence: EvidenceRepo
  readonly audit: AuditRepo
}
