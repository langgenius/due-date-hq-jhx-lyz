// @duedatehq/contracts — single source of truth shared by apps/app and apps/server.
// HARD CONSTRAINTS (docs/dev-file/08 §4.3):
//   - Only `zod` and `@orpc/contract` imports are allowed.
//   - Schemas must be usable as both input and output validators (no field drift).
//   - Mutations to contract files require a `[contract]` PR label.

import { oc } from '@orpc/contract'
import { auditContract } from './audit'
import { calendarContract } from './calendar'
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
import { notificationsContract } from './notifications'
import { readinessContract } from './readiness'
import { rulesContract } from './rules'
import { securityContract } from './security'

export const appContract = oc.router({
  audit: auditContract,
  calendar: calendarContract,
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
  notifications: notificationsContract,
  readiness: readinessContract,
  rules: rulesContract,
  security: securityContract,
})

export type AppContract = typeof appContract

export type {
  CalendarContract,
  CalendarPrivacyMode,
  CalendarSubscriptionByIdInput,
  CalendarSubscriptionPublic,
  CalendarSubscriptionScope,
  CalendarSubscriptionStatus,
  CalendarUpsertSubscriptionInput,
} from './calendar'
export {
  calendarContract,
  CalendarPrivacyModeSchema,
  CalendarSubscriptionByIdInputSchema,
  CalendarSubscriptionPublicSchema,
  CalendarSubscriptionScopeSchema,
  CalendarSubscriptionStatusSchema,
  CalendarUpsertSubscriptionInputSchema,
} from './calendar'

export type {
  EnableTwoFactorOutput,
  SecurityContract,
  SecurityMutationOutput,
  SecuritySession,
  SecurityStatus,
  RevokeSessionInput,
  VerifyTwoFactorInput,
} from './security'
export {
  EnableTwoFactorOutputSchema,
  RevokeSessionInputSchema,
  SecurityMutationOutputSchema,
  SecuritySessionSchema,
  SecurityStatusSchema,
  securityContract,
  VerifyTwoFactorInputSchema,
} from './security'

export type {
  AiInsightCitation,
  AiInsightCitationEvidence,
  AiInsightKind,
  AiInsightPublic,
  AiInsightSection,
  AiInsightStatus,
} from './ai-insights'
export {
  AiInsightCitationEvidenceSchema,
  AiInsightCitationSchema,
  AiInsightKindSchema,
  AiInsightPublicSchema,
  AiInsightSectionSchema,
  AiInsightStatusSchema,
} from './ai-insights'

export type {
  SmartPriorityBreakdown,
  SmartPriorityFactor,
  SmartPriorityFactorKey,
  SmartPriorityProfile,
  SmartPriorityWeights,
} from './priority'
export {
  SMART_PRIORITY_DEFAULT_PROFILE,
  SmartPriorityBreakdownSchema,
  SmartPriorityFactorKeySchema,
  SmartPriorityFactorSchema,
  SmartPriorityProfileSchema,
  SmartPriorityProfileVersionSchema,
  SmartPriorityWeightsSchema,
} from './priority'

export type {
  AuditActionCategory,
  AuditContract,
  AuditEvidencePackagePublic,
  AuditEventPublic,
  AuditListInput,
  AuditListOutput,
  AuditRequestEvidencePackageInput,
  AuditRange,
} from './audit'
export {
  AUDIT_FILTER_MAX_LENGTH,
  AUDIT_SEARCH_MAX_LENGTH,
  AuditActionCategorySchema,
  AuditEvidencePackagePublicSchema,
  AuditEvidencePackageScopeSchema,
  AuditEvidencePackageStatusSchema,
  AuditEventPublicSchema,
  AuditListInputSchema,
  AuditListOutputSchema,
  AuditRequestEvidencePackageInputSchema,
  AuditRangeSchema,
  auditContract,
} from './audit'

export type {
  FirmBillingCheckoutConfig,
  FirmBillingSubscriptionPublic,
  FirmCreateInput,
  FirmPlan,
  FirmPublic,
  FirmRole,
  FirmSelfServeBillingPlan,
  FirmSmartPriorityPreviewInput,
  FirmSmartPriorityPreviewOutput,
  FirmSmartPriorityPreviewRow,
  FirmsContract,
  FirmStatus,
  FirmUpdateInput,
  USFirmTimezone,
} from './firms'
export {
  FirmBillingCheckoutConfigSchema,
  FirmBillingSubscriptionPublicSchema,
  FirmCreateInputSchema,
  FirmPlanSchema,
  FirmSelfServeBillingPlanSchema,
  FirmSmartPriorityPreviewInputSchema,
  FirmSmartPriorityPreviewOutputSchema,
  FirmSmartPriorityPreviewRowSchema,
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
export type {
  ClientBulkAssigneeUpdateInput,
  ClientBulkAssigneeUpdateOutput,
  ClientCreateInput,
  ClientIdentity,
  ClientImportanceWeight,
  ClientJurisdictionUpdateInput,
  ClientJurisdictionUpdateOutput,
  ClientPenaltyInputsUpdateInput,
  ClientPenaltyInputsUpdateOutput,
  ClientPublic,
  ClientRiskProfileUpdateInput,
  ClientRiskProfileUpdateOutput,
  ClientRiskSummaryInput,
  ClientRiskSummaryRefreshInput,
  ClientRiskSummaryRefreshOutput,
  ClientsContract,
} from './clients'
export {
  ClientBulkAssigneeUpdateInputSchema,
  ClientBulkAssigneeUpdateOutputSchema,
  ClientCreateInputSchema,
  ClientIdentitySchema,
  ClientImportanceWeightSchema,
  ClientJurisdictionUpdateOutputSchema,
  ClientJurisdictionUpdateSchema,
  ClientPenaltyInputsUpdateOutputSchema,
  ClientPenaltyInputsUpdateSchema,
  ClientPublicSchema,
  ClientRiskProfileUpdateOutputSchema,
  ClientRiskProfileUpdateSchema,
  ClientRiskSummaryInputSchema,
  ClientRiskSummaryRefreshInputSchema,
  ClientRiskSummaryRefreshOutputSchema,
  clientsContract,
} from './clients'

export type {
  DeadlineTipInput,
  DeadlineTipRefreshInput,
  DeadlineTipRefreshOutput,
  DueDateUpdateInput,
  ObligationBulkReadinessUpdateInput,
  ObligationBulkReadinessUpdateOutput,
  ObligationBulkStatusUpdateInput,
  ObligationBulkStatusUpdateOutput,
  ObligationCreateInput,
  ObligationExtensionDecisionInput,
  ObligationExtensionDecisionOutput,
  ObligationInstancePublic,
  ObligationReadinessUpdateInput,
  ObligationReadinessUpdateOutput,
  ObligationStatusUpdateInput,
  ObligationStatusUpdateOutput,
  ObligationsContract,
  PenaltyBreakdownItem,
} from './obligations'
export {
  DeadlineTipInputSchema,
  DeadlineTipRefreshInputSchema,
  DeadlineTipRefreshOutputSchema,
  DueDateUpdateInputSchema,
  ObligationBulkReadinessUpdateInputSchema,
  ObligationBulkReadinessUpdateOutputSchema,
  ObligationBulkStatusUpdateInputSchema,
  ObligationBulkStatusUpdateOutputSchema,
  ObligationCreateInputSchema,
  ObligationExtensionDecisionInputSchema,
  ObligationExtensionDecisionOutputSchema,
  ObligationInstancePublicSchema,
  ObligationReadinessUpdateInputSchema,
  ObligationReadinessUpdateOutputSchema,
  ObligationStatusUpdateInputSchema,
  ObligationStatusUpdateOutputSchema,
  obligationsContract,
  PenaltyBreakdownItemSchema,
} from './obligations'

export type {
  DashboardBriefCitation,
  DashboardBriefCitationEvidence,
  DashboardBriefCitations,
  DashboardBriefPublic,
  DashboardBriefScope,
  DashboardBriefStatus,
  DashboardClientFacetOption,
  DashboardContract,
  DashboardDueBucket,
  DashboardEvidenceFilter,
  DashboardFacetOption,
  DashboardFacetsOutput,
  DashboardLoadInput,
  DashboardLoadOutput,
  DashboardRequestBriefRefreshInput,
  DashboardRequestBriefRefreshOutput,
  DashboardSeverity,
  DashboardSummary,
  DashboardTopRow,
  DashboardTriageTab,
  DashboardTriageTabKey,
} from './dashboard'
export {
  DASHBOARD_FILTER_MAX_SELECTIONS,
  DASHBOARD_FILTER_VALUE_MAX_LENGTH,
  DashboardBriefCitationEvidenceSchema,
  DashboardBriefCitationSchema,
  DashboardBriefCitationsSchema,
  DashboardBriefPublicSchema,
  DashboardBriefScopeSchema,
  DashboardBriefStatusSchema,
  DashboardClientFacetOptionSchema,
  DashboardDueBucketSchema,
  DashboardEvidenceFilterSchema,
  DashboardFacetOptionSchema,
  DashboardFacetsOutputSchema,
  DashboardLoadInputSchema,
  DashboardLoadOutputSchema,
  DashboardRequestBriefRefreshInputSchema,
  DashboardRequestBriefRefreshOutputSchema,
  DashboardSeveritySchema,
  DashboardSummarySchema,
  DashboardTopRowSchema,
  DashboardTriageTabKeySchema,
  DashboardTriageTabSchema,
  dashboardContract,
} from './dashboard'

export type { EvidenceContract, EvidencePublic } from './evidence'
export { EvidencePublicSchema, evidenceContract } from './evidence'

export type {
  WorkboardClientFacetOption,
  WorkboardCountyFacetOption,
  WorkboardDueFilter,
  WorkboardFacetOption,
  WorkboardFacetsOutput,
  WorkboardOwnerFilter,
  WorkboardContract,
  WorkboardColumnVisibility,
  WorkboardCreateSavedViewInput,
  WorkboardDeleteSavedViewInput,
  WorkboardDensity,
  WorkboardExportSelectedInput,
  WorkboardExportSelectedOutput,
  WorkboardDetail,
  WorkboardDetailInput,
  WorkboardDetailTab,
  WorkboardMatchedRule,
  WorkboardListInput,
  WorkboardListOutput,
  WorkboardReadiness,
  WorkboardRow,
  WorkboardSavedView,
  WorkboardSavedViewQuery,
  WorkboardUpdateSavedViewInput,
  WorkboardSort,
} from './workboard'
export {
  WORKBOARD_FILTER_MAX_SELECTIONS,
  WORKBOARD_FILTER_VALUE_MAX_LENGTH,
  WORKBOARD_SEARCH_MAX_LENGTH,
  WorkboardClientFacetOptionSchema,
  WorkboardColumnVisibilitySchema,
  WorkboardCountyFacetOptionSchema,
  WorkboardCreateSavedViewInputSchema,
  WorkboardDeleteSavedViewInputSchema,
  WorkboardDensitySchema,
  WorkboardDueFilterSchema,
  WorkboardExportSelectedInputSchema,
  WorkboardExportSelectedOutputSchema,
  WorkboardDetailInputSchema,
  WorkboardDetailSchema,
  WorkboardDetailTabSchema,
  WorkboardFacetOptionSchema,
  WorkboardFacetsOutputSchema,
  WorkboardListInputSchema,
  WorkboardListOutputSchema,
  WorkboardOwnerFilterSchema,
  WorkboardMatchedRuleSchema,
  WorkboardReadinessSchema,
  WorkboardRowSchema,
  WorkboardSavedViewQuerySchema,
  WorkboardSavedViewSchema,
  WorkboardSortSchema,
  WorkboardUpdateSavedViewInputSchema,
  workboardContract,
} from './workboard'

export type {
  ClientReadinessRequestPublic,
  ClientReadinessResponsePublic,
  ReadinessContract,
  ReadinessGenerateChecklistInput,
  ReadinessGenerateChecklistOutput,
  ReadinessListByObligationInput,
  ReadinessListByObligationOutput,
  ReadinessPublicPortal,
  ReadinessPublicPortalItem,
  ReadinessPublicSubmitInput,
  ReadinessPublicSubmitOutput,
  ReadinessRequestStatus,
  ReadinessResponseStatus,
  ReadinessRevokeRequestInput,
  ReadinessRevokeRequestOutput,
  ReadinessSendRequestInput,
  ReadinessSendRequestOutput,
  ReadinessChecklistItem,
} from './readiness'
export {
  ClientReadinessRequestPublicSchema,
  ClientReadinessResponsePublicSchema,
  readinessContract,
  ReadinessGenerateChecklistInputSchema,
  ReadinessGenerateChecklistOutputSchema,
  ReadinessListByObligationInputSchema,
  ReadinessListByObligationOutputSchema,
  ReadinessPublicPortalItemSchema,
  ReadinessPublicPortalSchema,
  ReadinessPublicSubmitInputSchema,
  ReadinessPublicSubmitOutputSchema,
  ReadinessRequestStatusSchema,
  ReadinessResponseStatusSchema,
  ReadinessRevokeRequestInputSchema,
  ReadinessRevokeRequestOutputSchema,
  ReadinessSendRequestInputSchema,
  ReadinessSendRequestOutputSchema,
  ReadinessChecklistItemSchema,
} from './readiness'

export type {
  WorkloadContract,
  WorkloadLoadInput,
  WorkloadLoadOutput,
  WorkloadManagerInsights,
  WorkloadOwnerKind,
  WorkloadOwnerRow,
  WorkloadSummary,
} from './workload'
export {
  WorkloadLoadInputSchema,
  WorkloadLoadOutputSchema,
  WorkloadManagerInsightsSchema,
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
  PulseReactivateOutput,
  PulseRequestReviewInput,
  PulseRequestReviewOutput,
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
  PulseReactivateOutputSchema,
  PulseRequestReviewInputSchema,
  PulseRequestReviewOutputSchema,
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
  RuleRejectCandidateInput,
  RuleReviewDecision,
  RuleReviewDecisionStatus,
  RuleSource,
  RuleVerifyCandidateInput,
  RulesContract,
  RulesListInput,
  RulesReviewListInput,
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
  RuleGenerationStateValues,
  RuleCoverageRowSchema,
  RuleEvidenceAuthorityRoleSchema,
  RuleEvidenceLocatorSchema,
  RuleEvidenceSchema,
  RuleJurisdictionSchema,
  RuleJurisdictionValues,
  RuleNotificationChannelSchema,
  RuleQualityChecklistSchema,
  RuleRejectCandidateInputSchema,
  RuleRiskLevelSchema,
  RuleReviewDecisionSchema,
  RuleReviewDecisionStatusSchema,
  RulesReviewListInputSchema,
  RuleSourceSchema,
  RuleSourcesListInputSchema,
  RuleSourceTypeSchema,
  RuleStatusSchema,
  RuleVerifyCandidateInputSchema,
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
  MemberAssigneeOption,
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
  MemberAssigneeOptionSchema,
  MemberInviteInputSchema,
  MemberManagedRoleSchema,
  MemberPublicSchema,
  membersContract,
  MembersListOutputSchema,
  MemberStatusSchema,
  MemberUpdateRoleInputSchema,
} from './members'

export type {
  InAppNotificationPublic,
  NotificationPreferencePublic,
  NotificationsContract,
  NotificationType,
} from './notifications'
export {
  InAppNotificationPublicSchema,
  NotificationListInputSchema,
  NotificationPreferencePublicSchema,
  notificationsContract,
  NotificationStatusFilterSchema,
  NotificationTypeSchema,
} from './notifications'

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
  MigrationCloneStagingRowsInput,
  MigrationContract,
  MigrationError,
  MigrationErrorStage,
  MigrationExternalEntityType,
  MigrationExternalReference,
  MigrationExposureSummary,
  MigrationExposureTopRow,
  MigrationExternalStagingRowInput,
  MigrationIntegrationProvider,
  MigrationListErrorsInput,
  MigrationSource,
  MigrationStageExternalRowsInput,
  MigrationStageExternalRowsOutput,
  MigrationStagingRow,
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
  MigrationCloneStagingRowsInputSchema,
  MigrationErrorSchema,
  MigrationErrorStageSchema,
  MigrationExternalEntityTypeSchema,
  MigrationExternalReferenceSchema,
  MigrationExposureSummarySchema,
  MigrationExposureTopRowSchema,
  MigrationExternalStagingRowInputSchema,
  MigrationIntegrationProviderSchema,
  MigrationListErrorsInputSchema,
  MigrationSourceSchema,
  MigrationStageExternalRowsInputSchema,
  MigrationStageExternalRowsOutputSchema,
  MigrationStagingRowSchema,
  NormalizationRowSchema,
  migrationContract,
} from './migration'

export {
  AuditActions,
  AuditActionSchema,
  PenaltyAuditActions,
  PenaltyAuditActionSchema,
  MigrationAuditActions,
  MigrationAuditActionSchema,
  PulseAuditActions,
  PulseAuditActionSchema,
} from './shared/audit-actions'
export type {
  AuditAction,
  MigrationAuditAction,
  PenaltyAuditAction,
  PulseAuditAction,
} from './shared/audit-actions'
export { EvidenceSourceTypes, EvidenceSourceTypeSchema } from './shared/evidence-source-types'
export type { EvidenceSourceType } from './shared/evidence-source-types'
export {
  ObligationExtensionDecisionSchema,
  ObligationReadinessSchema,
  ObligationStatusSchema,
} from './shared/enums'
export type {
  ObligationExtensionDecision,
  ObligationReadiness,
  ObligationStatus,
} from './shared/enums'
export { EntityIdSchema, TenantIdSchema } from './shared/ids'
export type { EntityId, TenantId } from './shared/ids'
export { ErrorCodes } from './errors'
export type { ErrorCode } from './errors'
