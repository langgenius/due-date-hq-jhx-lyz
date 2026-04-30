// @duedatehq/contracts — single source of truth shared by apps/app and apps/server.
// HARD CONSTRAINTS (docs/dev-file/08 §4.3):
//   - Only `zod` and `@orpc/contract` imports are allowed.
//   - Schemas must be usable as both input and output validators (no field drift).
//   - Mutations to contract files require a `[contract]` PR label.

import { oc } from '@orpc/contract'
import { auditContract } from './audit'
import { clientsContract } from './clients'
import { obligationsContract } from './obligations'
import { dashboardContract } from './dashboard'
import { evidenceContract } from './evidence'
import { firmsContract } from './firms'
import { workboardContract } from './workboard'
import { workloadContract } from './workload'
import { pulseContract } from './pulse'
import { migrationContract } from './migration'
import { membersContract } from './members'
import { rulesContract } from './rules'

export const appContract = oc.router({
  audit: auditContract,
  firms: firmsContract,
  clients: clientsContract,
  obligations: obligationsContract,
  dashboard: dashboardContract,
  evidence: evidenceContract,
  workboard: workboardContract,
  workload: workloadContract,
  pulse: pulseContract,
  migration: migrationContract,
  members: membersContract,
  rules: rulesContract,
})

export type AppContract = typeof appContract

export type {
  AuditActionCategory,
  AuditContract,
  AuditEventPublic,
  AuditListInput,
  AuditListOutput,
  AuditRange,
} from './audit'
export {
  AUDIT_FILTER_MAX_LENGTH,
  AUDIT_SEARCH_MAX_LENGTH,
  AuditActionCategorySchema,
  AuditEventPublicSchema,
  AuditListInputSchema,
  AuditListOutputSchema,
  AuditRangeSchema,
  auditContract,
} from './audit'

export type {
  FirmBillingSubscriptionPublic,
  FirmCreateInput,
  FirmPlan,
  FirmPublic,
  FirmRole,
  FirmsContract,
  FirmStatus,
  FirmUpdateInput,
  USFirmTimezone,
} from './firms'
export {
  FirmBillingSubscriptionPublicSchema,
  FirmCreateInputSchema,
  FirmPlanSchema,
  FirmPublicSchema,
  FirmRoleSchema,
  firmsContract,
  FirmStatusSchema,
  FirmUpdateInputSchema,
  US_FIRM_TIMEZONE_OPTIONS,
  US_FIRM_TIMEZONES,
  USFirmTimezoneSchema,
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
  DashboardBriefCitation,
  DashboardBriefCitationEvidence,
  DashboardBriefCitations,
  DashboardBriefPublic,
  DashboardBriefScope,
  DashboardBriefStatus,
  DashboardContract,
  DashboardLoadInput,
  DashboardLoadOutput,
  DashboardRequestBriefRefreshInput,
  DashboardRequestBriefRefreshOutput,
  DashboardSeverity,
  DashboardSummary,
  DashboardTopRow,
} from './dashboard'
export {
  DashboardBriefCitationEvidenceSchema,
  DashboardBriefCitationSchema,
  DashboardBriefCitationsSchema,
  DashboardBriefPublicSchema,
  DashboardBriefScopeSchema,
  DashboardBriefStatusSchema,
  DashboardLoadInputSchema,
  DashboardLoadOutputSchema,
  DashboardRequestBriefRefreshInputSchema,
  DashboardRequestBriefRefreshOutputSchema,
  DashboardSeveritySchema,
  DashboardSummarySchema,
  DashboardTopRowSchema,
  dashboardContract,
} from './dashboard'

export type { EvidenceContract, EvidencePublic } from './evidence'
export { EvidencePublicSchema, evidenceContract } from './evidence'

export type {
  WorkboardDueFilter,
  WorkboardOwnerFilter,
  WorkboardContract,
  WorkboardListInput,
  WorkboardListOutput,
  WorkboardRow,
  WorkboardSort,
} from './workboard'
export {
  WORKBOARD_SEARCH_MAX_LENGTH,
  WorkboardDueFilterSchema,
  WorkboardListInputSchema,
  WorkboardListOutputSchema,
  WorkboardOwnerFilterSchema,
  WorkboardRowSchema,
  WorkboardSortSchema,
  workboardContract,
} from './workboard'

export type {
  WorkloadContract,
  WorkloadLoadInput,
  WorkloadLoadOutput,
  WorkloadOwnerKind,
  WorkloadOwnerRow,
  WorkloadSummary,
} from './workload'
export {
  WorkloadLoadInputSchema,
  WorkloadLoadOutputSchema,
  WorkloadOwnerKindSchema,
  WorkloadOwnerRowSchema,
  WorkloadSummarySchema,
  WorkloadWindowMaxDays,
  workloadContract,
} from './workload'

export type {
  PulseAffectedClient,
  PulseAffectedClientStatus,
  PulseAlertPublic,
  PulseApplyInput,
  PulseApplyOutput,
  PulseContract,
  PulseDetail,
  PulseDismissOutput,
  PulseFirmAlertStatus,
  PulseListHistoryInput,
  PulseListAlertsInput,
  PulseSourceHealth,
  PulseSourceHealthStatus,
  PulseRevertOutput,
  PulseSnoozeInput,
  PulseSnoozeOutput,
  PulseStatus,
} from './pulse'
export {
  PulseAffectedClientSchema,
  PulseAffectedClientStatusSchema,
  PulseAlertIdInputSchema,
  PulseAlertPublicSchema,
  PulseApplyInputSchema,
  PulseApplyOutputSchema,
  pulseContract,
  PulseDetailSchema,
  PulseDismissOutputSchema,
  PulseFirmAlertStatusSchema,
  PulseListHistoryInputSchema,
  PulseListAlertsInputSchema,
  PulseSourceHealthSchema,
  PulseSourceHealthStatusSchema,
  PulseRevertOutputSchema,
  PulseSnoozeInputSchema,
  PulseSnoozeOutputSchema,
  PulseStatusSchema,
} from './pulse'

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
  MemberInvitationPublic,
  MemberInvitationStatus,
  MemberInviteInput,
  MemberManagedRole,
  MemberPublic,
  MembersContract,
  MembersListOutput,
  MemberStatus,
} from './members'
export {
  MemberIdInputSchema,
  MemberInvitationIdInputSchema,
  MemberInvitationPublicSchema,
  MemberInvitationStatusSchema,
  MemberInviteInputSchema,
  MemberManagedRoleSchema,
  MemberPublicSchema,
  membersContract,
  MembersListOutputSchema,
  MemberStatusSchema,
  MemberUpdateRoleInputSchema,
} from './members'

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

export {
  AuditActions,
  AuditActionSchema,
  MigrationAuditActions,
  MigrationAuditActionSchema,
  PulseAuditActions,
  PulseAuditActionSchema,
} from './shared/audit-actions'
export type { AuditAction, MigrationAuditAction, PulseAuditAction } from './shared/audit-actions'
export { EvidenceSourceTypes, EvidenceSourceTypeSchema } from './shared/evidence-source-types'
export type { EvidenceSourceType } from './shared/evidence-source-types'
export { EntityIdSchema, TenantIdSchema } from './shared/ids'
export type { EntityId, TenantId } from './shared/ids'
export { ErrorCodes } from './errors'
export type { ErrorCode } from './errors'
