import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EntityTypeSchema } from './shared/enums'

export const RuleJurisdictionSchema = z.enum(['FED', 'CA', 'NY', 'TX', 'FL', 'WA'])
export type RuleJurisdiction = z.infer<typeof RuleJurisdictionSchema>
export const RuleGenerationStateSchema = z.enum(['CA', 'NY', 'TX', 'FL', 'WA'])
export type RuleGenerationState = z.infer<typeof RuleGenerationStateSchema>

export const RuleSourceTypeSchema = z.enum([
  'publication',
  'instructions',
  'due_dates',
  'calendar',
  'emergency_relief',
  'news',
  'form',
  'early_warning',
  'subscription',
])

export const AcquisitionMethodSchema = z.enum([
  'html_watch',
  'pdf_watch',
  'manual_review',
  'email_subscription',
  'api_watch',
])

export const SourceCadenceSchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'pre_season'])

export const SourcePrioritySchema = z.enum(['critical', 'high', 'medium', 'low'])
export const SourceHealthStatusSchema = z.enum(['healthy', 'degraded', 'failing', 'paused'])

export const RuleNotificationChannelSchema = z.enum([
  'ops_source_change',
  'candidate_review',
  'publish_preview',
  'user_deadline_reminder',
])

export const RuleSourceSchema = z.object({
  id: z.string().min(1),
  jurisdiction: RuleJurisdictionSchema,
  title: z.string().min(1),
  url: z.url(),
  sourceType: RuleSourceTypeSchema,
  acquisitionMethod: AcquisitionMethodSchema,
  cadence: SourceCadenceSchema,
  priority: SourcePrioritySchema,
  healthStatus: SourceHealthStatusSchema,
  isEarlyWarning: z.boolean(),
  notificationChannels: z.array(RuleNotificationChannelSchema),
  lastReviewedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type RuleSource = z.infer<typeof RuleSourceSchema>

export const EntityApplicabilitySchema = z.enum([
  'llc',
  'partnership',
  's_corp',
  'c_corp',
  'sole_prop',
  'trust',
  'individual',
  'any_business',
])

export const RuleGenerationEntitySchema = EntityTypeSchema

export const ObligationEventTypeSchema = z.enum([
  'filing',
  'payment',
  'extension',
  'election',
  'information_report',
])
export const RuleTierSchema = z.enum([
  'basic',
  'annual_rolling',
  'exception',
  'applicability_review',
])
export const RuleStatusSchema = z.enum(['candidate', 'verified', 'deprecated'])
export const RuleRiskLevelSchema = z.enum(['low', 'med', 'high'])
export const CoverageStatusSchema = z.enum(['full', 'skeleton', 'manual'])

export const DueDateLogicSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('fixed_date'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    holidayRollover: z.enum(['source_adjusted', 'next_business_day']),
  }),
  z.object({
    kind: z.literal('nth_day_after_tax_year_end'),
    monthOffset: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    holidayRollover: z.literal('next_business_day'),
  }),
  z.object({
    kind: z.literal('nth_day_after_tax_year_begin'),
    monthOffset: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    holidayRollover: z.literal('next_business_day'),
  }),
  z.object({
    kind: z.literal('period_table'),
    frequency: z.enum(['monthly', 'quarterly', 'annual']),
    periods: z.array(
      z.object({
        period: z.string().min(1),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    ),
    holidayRollover: z.literal('source_adjusted'),
  }),
  z.object({
    kind: z.literal('source_defined_calendar'),
    description: z.string().min(1),
    holidayRollover: z.enum(['source_adjusted', 'next_business_day']),
  }),
])
export type DueDateLogic = z.infer<typeof DueDateLogicSchema>

export const ExtensionPolicySchema = z.object({
  available: z.boolean(),
  formName: z.string().min(1).optional(),
  durationMonths: z.number().int().positive().optional(),
  paymentExtended: z.boolean(),
  notes: z.string().min(1),
})

export const RuleQualityChecklistSchema = z.object({
  filingPaymentDistinguished: z.boolean(),
  extensionHandled: z.boolean(),
  calendarFiscalSpecified: z.boolean(),
  holidayRolloverHandled: z.boolean(),
  crossVerified: z.boolean(),
  exceptionChannel: z.boolean(),
})

export const RuleEvidenceAuthorityRoleSchema = z.enum([
  'basis',
  'cross_check',
  'watch',
  'early_warning',
])
export type RuleEvidenceAuthorityRole = z.infer<typeof RuleEvidenceAuthorityRoleSchema>
export const RuleEvidenceLocatorSchema = z.object({
  kind: z.enum(['html', 'pdf', 'table', 'api', 'email_subscription']),
  heading: z.string().min(1).optional(),
  selector: z.string().min(1).optional(),
  pdfPage: z.number().int().positive().optional(),
  tableLabel: z.string().min(1).optional(),
  rowLabel: z.string().min(1).optional(),
})
export type RuleEvidenceLocator = z.infer<typeof RuleEvidenceLocatorSchema>

export const RuleEvidenceSchema = z.object({
  sourceId: z.string().min(1),
  authorityRole: RuleEvidenceAuthorityRoleSchema,
  locator: RuleEvidenceLocatorSchema,
  summary: z.string().min(1),
  sourceExcerpt: z.string().min(1),
  retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceUpdatedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})
export type RuleEvidence = z.infer<typeof RuleEvidenceSchema>

export const ObligationRuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  jurisdiction: RuleJurisdictionSchema,
  entityApplicability: z.array(EntityApplicabilitySchema),
  taxType: z.string().min(1),
  formName: z.string().min(1),
  eventType: ObligationEventTypeSchema,
  isFiling: z.boolean(),
  isPayment: z.boolean(),
  taxYear: z.number().int().min(2000).max(2100),
  applicableYear: z.number().int().min(2000).max(2100),
  ruleTier: RuleTierSchema,
  status: RuleStatusSchema,
  coverageStatus: CoverageStatusSchema,
  riskLevel: RuleRiskLevelSchema,
  requiresApplicabilityReview: z.boolean(),
  dueDateLogic: DueDateLogicSchema,
  extensionPolicy: ExtensionPolicySchema,
  sourceIds: z.array(z.string().min(1)),
  evidence: z.array(RuleEvidenceSchema),
  defaultTip: z.string().min(1),
  quality: RuleQualityChecklistSchema,
  verifiedBy: z.string().min(1),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nextReviewOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  version: z.number().int().positive(),
})
export type ObligationRule = z.infer<typeof ObligationRuleSchema>

export const RuleCoverageRowSchema = z.object({
  jurisdiction: RuleJurisdictionSchema,
  sourceCount: z.number().int().nonnegative(),
  verifiedRuleCount: z.number().int().nonnegative(),
  candidateCount: z.number().int().nonnegative(),
  highPrioritySourceCount: z.number().int().nonnegative(),
})
export type RuleCoverageRow = z.infer<typeof RuleCoverageRowSchema>

export const RuleGenerationClientFactsSchema = z.object({
  id: z.string().min(1),
  entityType: RuleGenerationEntitySchema,
  state: RuleGenerationStateSchema,
  taxTypes: z.array(z.string().min(1)),
  taxYearStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  taxYearEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})
export type RuleGenerationClientFacts = z.infer<typeof RuleGenerationClientFactsSchema>

export const RuleGenerationPreviewInputSchema = z.object({
  client: RuleGenerationClientFactsSchema,
  holidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
})
export type RuleGenerationPreviewInput = z.infer<typeof RuleGenerationPreviewInputSchema>

export const ObligationGenerationPreviewSchema = z.object({
  clientId: z.string().min(1),
  ruleId: z.string().min(1),
  ruleVersion: z.number().int().positive(),
  ruleTitle: z.string().min(1),
  jurisdiction: RuleJurisdictionSchema,
  taxType: z.string().min(1),
  matchedTaxType: z.string().min(1),
  period: z.string().min(1),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  eventType: ObligationEventTypeSchema,
  isFiling: z.boolean(),
  isPayment: z.boolean(),
  formName: z.string().min(1),
  sourceIds: z.array(z.string().min(1)),
  evidence: z.array(RuleEvidenceSchema),
  requiresReview: z.boolean(),
  reminderReady: z.boolean(),
  reviewReasons: z.array(z.string().min(1)),
})
export type ObligationGenerationPreview = z.infer<typeof ObligationGenerationPreviewSchema>

export const RulesListInputSchema = z
  .object({
    jurisdiction: RuleJurisdictionSchema.optional(),
    status: RuleStatusSchema.optional(),
    includeCandidates: z.boolean().optional(),
  })
  .optional()
export type RulesListInput = z.infer<typeof RulesListInputSchema>

export const RuleSourcesListInputSchema = z
  .object({
    jurisdiction: RuleJurisdictionSchema.optional(),
  })
  .optional()
export type RuleSourcesListInput = z.infer<typeof RuleSourcesListInputSchema>

export const rulesContract = oc.router({
  listSources: oc.input(RuleSourcesListInputSchema).output(z.array(RuleSourceSchema)),
  listRules: oc.input(RulesListInputSchema).output(z.array(ObligationRuleSchema)),
  coverage: oc.input(z.undefined()).output(z.array(RuleCoverageRowSchema)),
  previewObligations: oc
    .input(RuleGenerationPreviewInputSchema)
    .output(z.array(ObligationGenerationPreviewSchema)),
})
export type RulesContract = typeof rulesContract
