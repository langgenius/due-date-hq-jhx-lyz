// @duedatehq/contracts — single source of truth shared by apps/app and apps/server.
// HARD CONSTRAINTS (docs/dev-file/08 §4.3):
//   - Only `zod` and `@orpc/contract` imports are allowed.
//   - Schemas must be usable as both input and output validators (no field drift).
//   - Mutations to contract files require a `[contract]` PR label.

import { oc } from '@orpc/contract'
import { clientsContract } from './clients'
import { obligationsContract } from './obligations'
import { dashboardContract } from './dashboard'
import { evidenceContract } from './evidence'
import { firmsContract } from './firms'
import { workboardContract } from './workboard'
import { pulseContract } from './pulse'
import { migrationContract } from './migration'
import { rulesContract } from './rules'

export const appContract = oc.router({
  firms: firmsContract,
  clients: clientsContract,
  obligations: obligationsContract,
  dashboard: dashboardContract,
  evidence: evidenceContract,
  workboard: workboardContract,
  pulse: pulseContract,
  migration: migrationContract,
  rules: rulesContract,
})

export type AppContract = typeof appContract

export type {
  FirmCreateInput,
  FirmPlan,
  FirmPublic,
  FirmRole,
  FirmsContract,
  FirmStatus,
  FirmUpdateInput,
} from './firms'
export {
  FirmCreateInputSchema,
  FirmPlanSchema,
  FirmPublicSchema,
  FirmRoleSchema,
  firmsContract,
  FirmStatusSchema,
  FirmUpdateInputSchema,
} from './firms'

// Re-export domain types so consumers can `import type { ... } from '@duedatehq/contracts'`
// without reaching into subpaths. Keeps the public surface stable + tree-shake-friendly.
export type { ClientCreateInput, ClientIdentity, ClientPublic, ClientsContract } from './clients'
export {
  ClientCreateInputSchema,
  ClientIdentitySchema,
  ClientPublicSchema,
  clientsContract,
} from './clients'

export type {
  DueDateUpdateInput,
  ObligationCreateInput,
  ObligationInstancePublic,
  ObligationStatusUpdateInput,
  ObligationStatusUpdateOutput,
  ObligationsContract,
} from './obligations'
export {
  DueDateUpdateInputSchema,
  ObligationCreateInputSchema,
  ObligationInstancePublicSchema,
  ObligationStatusUpdateInputSchema,
  ObligationStatusUpdateOutputSchema,
  obligationsContract,
} from './obligations'

export type {
  DashboardContract,
  DashboardLoadInput,
  DashboardLoadOutput,
  DashboardSeverity,
  DashboardSummary,
  DashboardTopRow,
} from './dashboard'
export {
  DashboardLoadInputSchema,
  DashboardLoadOutputSchema,
  DashboardSeveritySchema,
  DashboardSummarySchema,
  DashboardTopRowSchema,
  dashboardContract,
} from './dashboard'

export type { EvidenceContract, EvidencePublic } from './evidence'
export { EvidencePublicSchema, evidenceContract } from './evidence'

export type {
  WorkboardContract,
  WorkboardListInput,
  WorkboardListOutput,
  WorkboardRow,
  WorkboardSort,
} from './workboard'
export {
  WORKBOARD_SEARCH_MAX_LENGTH,
  WorkboardListInputSchema,
  WorkboardListOutputSchema,
  WorkboardRowSchema,
  WorkboardSortSchema,
  workboardContract,
} from './workboard'

export type {
  DueDateLogic,
  ObligationGenerationPreview,
  ObligationRule,
  RuleGenerationClientFacts,
  RuleGenerationPreviewInput,
  RuleGenerationState,
  RuleCoverageRow,
  RuleEvidence,
  RuleEvidenceAuthorityRole,
  RuleEvidenceLocator,
  RuleJurisdiction,
  RuleSource,
  RulesContract,
  RulesListInput,
  RuleSourcesListInput,
} from './rules'
export {
  AcquisitionMethodSchema,
  CoverageStatusSchema,
  DueDateLogicSchema,
  EntityApplicabilitySchema,
  ExtensionPolicySchema,
  ObligationEventTypeSchema,
  ObligationGenerationPreviewSchema,
  ObligationRuleSchema,
  RuleGenerationClientFactsSchema,
  RuleGenerationEntitySchema,
  RuleGenerationPreviewInputSchema,
  RuleGenerationStateSchema,
  RuleCoverageRowSchema,
  RuleEvidenceAuthorityRoleSchema,
  RuleEvidenceLocatorSchema,
  RuleEvidenceSchema,
  RuleJurisdictionSchema,
  RuleNotificationChannelSchema,
  RuleQualityChecklistSchema,
  RuleRiskLevelSchema,
  RuleSourceSchema,
  RuleSourcesListInputSchema,
  RuleSourceTypeSchema,
  RuleStatusSchema,
  RulesListInputSchema,
  rulesContract,
  RuleTierSchema,
  SourceCadenceSchema,
  SourceHealthStatusSchema,
  SourcePrioritySchema,
} from './rules'

export type {
  ApplyResult,
  DryRunSummary,
  MapperFallback,
  MapperRunOutput,
  MappingRow,
  MappingTarget,
  MatrixSelection,
  MigrationBatch,
  MigrationBatchStatus,
  MigrationContract,
  MigrationError,
  MigrationErrorStage,
  MigrationListErrorsInput,
  MigrationSource,
  NormalizationRow,
} from './migration'
export {
  ApplyResultSchema,
  DryRunSummarySchema,
  MapperFallbackSchema,
  MapperRunOutputSchema,
  MappingRowSchema,
  MappingTargetSchema,
  MatrixSelectionSchema,
  MigrationBatchSchema,
  MigrationBatchStatusSchema,
  MigrationErrorSchema,
  MigrationErrorStageSchema,
  MigrationListErrorsInputSchema,
  MigrationSourceSchema,
  NormalizationRowSchema,
  migrationContract,
} from './migration'

export { MigrationAuditActions, MigrationAuditActionSchema } from './shared/audit-actions'
export type { MigrationAuditAction } from './shared/audit-actions'
export { EvidenceSourceTypes, EvidenceSourceTypeSchema } from './shared/evidence-source-types'
export type { EvidenceSourceType } from './shared/evidence-source-types'
export { EntityIdSchema, TenantIdSchema } from './shared/ids'
export type { EntityId, TenantId } from './shared/ids'
export { ErrorCodes } from './errors'
export type { ErrorCode } from './errors'
