export const MVP_RULE_JURISDICTIONS = ['FED', 'CA', 'NY', 'TX', 'FL', 'WA'] as const

export type RuleJurisdiction = (typeof MVP_RULE_JURISDICTIONS)[number]

export type RuleSourceType =
  | 'publication'
  | 'instructions'
  | 'due_dates'
  | 'calendar'
  | 'emergency_relief'
  | 'news'
  | 'form'
  | 'early_warning'

export type AcquisitionMethod =
  | 'html_watch'
  | 'pdf_watch'
  | 'manual_review'
  | 'email_subscription'
  | 'api_watch'

export type SourceCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'pre_season'
export type SourcePriority = 'critical' | 'high' | 'medium' | 'low'
export type SourceHealthStatus = 'healthy' | 'degraded' | 'failing' | 'paused'

export type RuleNotificationChannel =
  | 'ops_source_change'
  | 'candidate_review'
  | 'publish_preview'
  | 'user_deadline_reminder'

export interface RuleSource {
  id: string
  jurisdiction: RuleJurisdiction
  title: string
  url: string
  sourceType: RuleSourceType
  acquisitionMethod: AcquisitionMethod
  cadence: SourceCadence
  priority: SourcePriority
  healthStatus: SourceHealthStatus
  isEarlyWarning: boolean
  notificationChannels: readonly RuleNotificationChannel[]
  lastReviewedOn: string
}

export type EntityApplicability =
  | 'llc'
  | 'partnership'
  | 's_corp'
  | 'c_corp'
  | 'sole_prop'
  | 'trust'
  | 'individual'
  | 'any_business'

export type ObligationEventType =
  | 'filing'
  | 'payment'
  | 'extension'
  | 'election'
  | 'information_report'
export type RuleTier = 'basic' | 'annual_rolling' | 'exception' | 'applicability_review'
export type RuleStatus = 'candidate' | 'verified' | 'deprecated'
export type RuleRiskLevel = 'low' | 'med' | 'high'
export type CoverageStatus = 'full' | 'skeleton' | 'manual'

export type DueDateLogic =
  | {
      kind: 'fixed_date'
      date: string
      holidayRollover: 'source_adjusted' | 'next_business_day'
    }
  | {
      kind: 'nth_day_after_tax_year_end'
      monthOffset: number
      day: number
      holidayRollover: 'next_business_day'
    }
  | {
      kind: 'nth_day_after_tax_year_begin'
      monthOffset: number
      day: number
      holidayRollover: 'next_business_day'
    }
  | {
      kind: 'period_table'
      frequency: 'monthly' | 'quarterly' | 'annual'
      periods: readonly { period: string; dueDate: string }[]
      holidayRollover: 'source_adjusted'
    }
  | {
      kind: 'source_defined_calendar'
      description: string
      holidayRollover: 'source_adjusted' | 'next_business_day'
    }

export interface ExtensionPolicy {
  available: boolean
  formName?: string
  durationMonths?: number
  paymentExtended: boolean
  notes: string
}

export interface RuleQualityChecklist {
  filingPaymentDistinguished: boolean
  extensionHandled: boolean
  calendarFiscalSpecified: boolean
  holidayRolloverHandled: boolean
  crossVerified: boolean
  exceptionChannel: boolean
}

export interface RuleEvidence {
  sourceId: string
  locator: string
  summary: string
}

export interface ObligationRule {
  id: string
  title: string
  jurisdiction: RuleJurisdiction
  entityApplicability: readonly EntityApplicability[]
  taxType: string
  formName: string
  eventType: ObligationEventType
  isFiling: boolean
  isPayment: boolean
  taxYear: number
  applicableYear: number
  ruleTier: RuleTier
  status: RuleStatus
  coverageStatus: CoverageStatus
  riskLevel: RuleRiskLevel
  requiresApplicabilityReview: boolean
  dueDateLogic: DueDateLogic
  extensionPolicy: ExtensionPolicy
  sourceIds: readonly string[]
  evidence: readonly RuleEvidence[]
  defaultTip: string
  quality: RuleQualityChecklist
  verifiedBy: string
  verifiedAt: string
  nextReviewOn: string
  version: number
}

const VERIFIED_QUALITY: RuleQualityChecklist = {
  filingPaymentDistinguished: true,
  extensionHandled: true,
  calendarFiscalSpecified: true,
  holidayRolloverHandled: true,
  crossVerified: true,
  exceptionChannel: true,
}

const VERIFIED_AT = '2026-04-27'
const NEXT_PRE_SEASON_REVIEW = '2026-11-15'

export const RULE_SOURCES = [
  {
    id: 'fed.irs_pub_509_2026',
    jurisdiction: 'FED',
    title: 'IRS Publication 509 (2026), Tax Calendars',
    url: 'https://www.irs.gov/publications/p509',
    sourceType: 'publication',
    acquisitionMethod: 'html_watch',
    cadence: 'pre_season',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'fed.irs_i7004_2025',
    jurisdiction: 'FED',
    title: 'IRS Instructions for Form 7004 (12/2025)',
    url: 'https://www.irs.gov/instructions/i7004',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'pre_season',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'fed.irs_disaster_relief',
    jurisdiction: 'FED',
    title: 'IRS Tax Relief in Disaster Situations',
    url: 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations',
    sourceType: 'emergency_relief',
    acquisitionMethod: 'html_watch',
    cadence: 'daily',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'fed.fema_disaster_declarations',
    jurisdiction: 'FED',
    title: 'FEMA Disaster Declarations Summaries',
    url: 'https://www.fema.gov/openfema-data-page/disaster-declarations-summaries-v2',
    sourceType: 'early_warning',
    acquisitionMethod: 'api_watch',
    cadence: 'daily',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: true,
    notificationChannels: ['ops_source_change', 'candidate_review'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ca.ftb_business_due_dates',
    jurisdiction: 'CA',
    title: 'California FTB Business Due Dates',
    url: 'https://www.ftb.ca.gov/file/when-to-file/due-dates-business.html',
    sourceType: 'due_dates',
    acquisitionMethod: 'html_watch',
    cadence: 'weekly',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ca.ftb_llc',
    jurisdiction: 'CA',
    title: 'California FTB Limited Liability Company',
    url: 'https://www.ftb.ca.gov/file/business/types/limited-liability-company.html',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'monthly',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ca.ftb_568_booklet_2025',
    jurisdiction: 'CA',
    title: 'California FTB 2025 Limited Liability Company Tax Booklet',
    url: 'https://www.ftb.ca.gov/forms/2025/2025-568-booklet.html',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'pre_season',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ca.ftb_emergency_tax_relief',
    jurisdiction: 'CA',
    title: 'California FTB Emergency Tax Relief',
    url: 'https://www.ftb.ca.gov/file/when-to-file/emergency-tax-relief.html',
    sourceType: 'emergency_relief',
    acquisitionMethod: 'html_watch',
    cadence: 'daily',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ca.ftb_tax_news',
    jurisdiction: 'CA',
    title: 'California FTB Tax News',
    url: 'https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/index.html',
    sourceType: 'news',
    acquisitionMethod: 'html_watch',
    cadence: 'weekly',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ny.tax_calendar_2026',
    jurisdiction: 'NY',
    title: 'New York 2026 Tax Filing Dates',
    url: 'https://www.tax.ny.gov/help/calendar/2026.htm',
    sourceType: 'calendar',
    acquisitionMethod: 'html_watch',
    cadence: 'pre_season',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ny.ptet',
    jurisdiction: 'NY',
    title: 'New York Pass-Through Entity Tax',
    url: 'https://www.tax.ny.gov/bus/ptet/',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'monthly',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ny.it204ll',
    jurisdiction: 'NY',
    title: 'New York Form IT-204-LL Instructions',
    url: 'https://www.tax.ny.gov/pdf/current_forms/it/it204lli.pdf',
    sourceType: 'instructions',
    acquisitionMethod: 'pdf_watch',
    cadence: 'pre_season',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'ny.article_9a',
    jurisdiction: 'NY',
    title: 'New York Article 9-A Franchise Tax on General Business Corporations',
    url: 'https://www.tax.ny.gov/bus/ct/article9a.htm',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'pre_season',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'tx.franchise_overview',
    jurisdiction: 'TX',
    title: 'Texas Comptroller Franchise Tax Overview',
    url: 'https://comptroller.texas.gov/taxes/publications/98-806.php',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'quarterly',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'tx.annual_report',
    jurisdiction: 'TX',
    title: 'Texas Annual Report Instructions',
    url: 'https://comptroller.texas.gov/help/franchise/information-report.php?category=taxes',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'quarterly',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'tx.pir_oir',
    jurisdiction: 'TX',
    title: 'Texas Franchise Tax PIR and OIR Filing Requirements',
    url: 'https://comptroller.texas.gov/taxes/franchise/pir-oir-filing-req.php',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'quarterly',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'fl.cit',
    jurisdiction: 'FL',
    title: 'Florida DOR Corporate Income Tax',
    url: 'https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'monthly',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'fl.cit_due_dates_2026',
    jurisdiction: 'FL',
    title: 'Florida Corporate Income Tax Due Dates',
    url: 'https://floridarevenue.com/taxes/Documents/flCitDueDates.pdf',
    sourceType: 'due_dates',
    acquisitionMethod: 'pdf_watch',
    cadence: 'pre_season',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'fl.tips',
    jurisdiction: 'FL',
    title: 'Florida DOR Tax Information Publications',
    url: 'https://floridarevenue.com/taxes/tips/Pages/default.aspx',
    sourceType: 'news',
    acquisitionMethod: 'html_watch',
    cadence: 'weekly',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'wa.excise_due_dates_2026',
    jurisdiction: 'WA',
    title: 'Washington DOR 2026 Excise Tax Return Due Dates',
    url: 'https://dor.wa.gov/file-pay-taxes/filing-frequencies-due-dates/2026-excise-tax-return-due-dates',
    sourceType: 'due_dates',
    acquisitionMethod: 'html_watch',
    cadence: 'pre_season',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'wa.bo',
    jurisdiction: 'WA',
    title: 'Washington DOR Business and Occupation Tax',
    url: 'https://dor.wa.gov/taxes-rates/business-occupation-tax',
    sourceType: 'instructions',
    acquisitionMethod: 'html_watch',
    cadence: 'quarterly',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'wa.news',
    jurisdiction: 'WA',
    title: 'Washington DOR News Releases',
    url: 'https://dor.wa.gov/about/news-releases',
    sourceType: 'news',
    acquisitionMethod: 'html_watch',
    cadence: 'weekly',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'wa.capital_gains_due_date_2026',
    jurisdiction: 'WA',
    title: 'Washington Capital Gains Excise Tax Due Date Moved to May 1, 2026',
    url: 'https://dor.wa.gov/about/news-releases/2026/capital-gains-excise-tax-returns-due-date-moved-may-1-2026',
    sourceType: 'news',
    acquisitionMethod: 'html_watch',
    cadence: 'weekly',
    priority: 'medium',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
] as const satisfies readonly RuleSource[]

function sourceEvidence(sourceId: string, locator: string, summary: string): RuleEvidence {
  return { sourceId, locator, summary }
}

export const OBLIGATION_RULES = [
  {
    id: 'fed.1065.return.2025',
    title: 'Federal Form 1065 return for partnerships',
    jurisdiction: 'FED',
    entityApplicability: ['partnership', 'llc'],
    taxType: 'federal_1065',
    formName: 'Form 1065',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'applicability_review',
    status: 'verified',
    coverageStatus: 'manual',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'nth_day_after_tax_year_end',
      monthOffset: 3,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      formName: 'Form 7004',
      durationMonths: 6,
      paymentExtended: false,
      notes: 'Form 7004 extends filing time only; payment obligations must be reviewed separately.',
    },
    sourceIds: ['fed.irs_pub_509_2026', 'fed.irs_i7004_2025'],
    evidence: [
      sourceEvidence(
        'fed.irs_pub_509_2026',
        'Partnerships / Form 1065',
        'Due on the 15th day of the 3rd month after tax year end.',
      ),
      sourceEvidence(
        'fed.irs_i7004_2025',
        'Purpose and When To File',
        'Form 7004 must be filed by the applicable return due date.',
      ),
    ],
    defaultTip: 'Calendar-year partnership returns for tax year 2025 roll to March 16, 2026.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'fed.1120s.return.2025',
    title: 'Federal Form 1120-S return for S corporations',
    jurisdiction: 'FED',
    entityApplicability: ['s_corp'],
    taxType: 'federal_1120s',
    formName: 'Form 1120-S',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'nth_day_after_tax_year_end',
      monthOffset: 3,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      formName: 'Form 7004',
      durationMonths: 6,
      paymentExtended: false,
      notes:
        'Extension applies to filing; any tax due should be paid by the original return due date.',
    },
    sourceIds: ['fed.irs_pub_509_2026', 'fed.irs_i7004_2025'],
    evidence: [
      sourceEvidence(
        'fed.irs_pub_509_2026',
        'Corporations and S Corporations / Form 1120-S',
        'Due on the 15th day of the 3rd month after tax year end.',
      ),
      sourceEvidence(
        'fed.irs_i7004_2025',
        'Extension Period',
        'Automatic extension period is generally 6 months.',
      ),
    ],
    defaultTip: 'Calendar-year 2025 S corporation returns roll to March 16, 2026.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'fed.1120.return.2025',
    title: 'Federal Form 1120 return for C corporations',
    jurisdiction: 'FED',
    entityApplicability: ['c_corp'],
    taxType: 'federal_1120',
    formName: 'Form 1120',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'nth_day_after_tax_year_end',
      monthOffset: 4,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      formName: 'Form 7004',
      durationMonths: 6,
      paymentExtended: false,
      notes: 'June year-end C corporation exceptions remain applicability-review cases.',
    },
    sourceIds: ['fed.irs_pub_509_2026', 'fed.irs_i7004_2025'],
    evidence: [
      sourceEvidence(
        'fed.irs_pub_509_2026',
        'Corporations and S Corporations / Form 1120',
        'Due on the 15th day of the 4th month after tax year end.',
      ),
      sourceEvidence(
        'fed.irs_i7004_2025',
        'Extension Period',
        'C corporation June year-end exceptions are called out separately.',
      ),
    ],
    defaultTip: 'Calendar-year C corporation returns for tax year 2025 are due April 15, 2026.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'fed.1120.estimated_tax.2026',
    title: 'Federal corporation estimated tax payments',
    jurisdiction: 'FED',
    entityApplicability: ['c_corp'],
    taxType: 'federal_1120_estimated_tax',
    formName: 'Estimated tax payments',
    eventType: 'payment',
    isFiling: false,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'annual_rolling',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'source_defined_calendar',
      description: '15th day of the 4th, 6th, 9th, and 12th months of the corporation tax year.',
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'Estimated tax payments are payment obligations, not filing extensions.',
    },
    sourceIds: ['fed.irs_pub_509_2026'],
    evidence: [
      sourceEvidence(
        'fed.irs_pub_509_2026',
        'Corporations and S Corporations / Estimated tax payments',
        'Payments follow the 4th, 6th, 9th, and 12th month schedule.',
      ),
    ],
    defaultTip:
      'Treat estimated tax as payment-only; do not suppress it when a filing extension exists.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'fed.disaster_relief.watch',
    title: 'Federal disaster tax relief candidate watch',
    jurisdiction: 'FED',
    entityApplicability: ['any_business', 'individual'],
    taxType: 'federal_disaster_relief',
    formName: 'IRS disaster relief notice',
    eventType: 'extension',
    isFiling: true,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'exception',
    status: 'candidate',
    coverageStatus: 'manual',
    riskLevel: 'high',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'source_defined_calendar',
      description: 'Specific notices define affected localities, acts, and postponed due dates.',
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'Disaster relief is notice-specific and must be reviewed before publication.',
    },
    sourceIds: ['fed.irs_disaster_relief', 'fed.fema_disaster_declarations'],
    evidence: [
      sourceEvidence(
        'fed.irs_disaster_relief',
        'Tax relief by date',
        'IRS publishes notice-specific disaster relief entries.',
      ),
      sourceEvidence(
        'fed.fema_disaster_declarations',
        'OpenFEMA declarations',
        'FEMA declarations are early-warning signals only.',
      ),
    ],
    defaultTip:
      'Route disaster relief changes to candidate review before any client reminder changes.',
    quality: { ...VERIFIED_QUALITY, crossVerified: false },
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: '2026-05-04',
    version: 1,
  },
  {
    id: 'ca.llc.568.return.2025',
    title: 'California LLC Form 568 return',
    jurisdiction: 'CA',
    entityApplicability: ['llc'],
    taxType: 'ca_llc_568',
    formName: 'Form 568',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'source_defined_calendar',
      description:
        'California LLC Form 568 due date depends on federal classification and owner type.',
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      durationMonths: 7,
      paymentExtended: false,
      notes: 'California LLC extension timing differs by classification; review entity facts.',
    },
    sourceIds: ['ca.ftb_business_due_dates', 'ca.ftb_568_booklet_2025'],
    evidence: [
      sourceEvidence(
        'ca.ftb_568_booklet_2025',
        'When and Where to File',
        'FTB distinguishes partnership-classified LLCs from SMLLCs for original return due dates.',
      ),
      sourceEvidence(
        'ca.ftb_568_booklet_2025',
        'Weekend or holiday note',
        'FTB rolls weekend or holiday due dates to the next business day.',
      ),
    ],
    defaultTip:
      'Confirm LLC federal classification and owner type before applying Form 568 timing.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ca.llc.annual_tax.2026',
    title: 'California LLC annual tax payment',
    jurisdiction: 'CA',
    entityApplicability: ['llc'],
    taxType: 'ca_llc_annual_tax',
    formName: 'FTB 3522',
    eventType: 'payment',
    isFiling: false,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'nth_day_after_tax_year_begin',
      monthOffset: 4,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'Payment obligation is not extended by filing extension.',
    },
    sourceIds: ['ca.ftb_business_due_dates', 'ca.ftb_568_booklet_2025'],
    evidence: [
      sourceEvidence(
        'ca.ftb_568_booklet_2025',
        'Annual Limited Liability Company Tax',
        'The annual tax is due on or before the 15th day of the 4th month after the beginning of the taxable year.',
      ),
    ],
    defaultTip: 'Separate the LLC annual tax payment from the Form 568 filing deadline.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ca.llc.estimated_fee.2026',
    title: 'California LLC estimated fee payment',
    jurisdiction: 'CA',
    entityApplicability: ['llc'],
    taxType: 'ca_llc_estimated_fee',
    formName: 'FTB 3536',
    eventType: 'payment',
    isFiling: false,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'applicability_review',
    status: 'verified',
    coverageStatus: 'manual',
    riskLevel: 'high',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'nth_day_after_tax_year_begin',
      monthOffset: 6,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'Fee amount depends on California-source total income.',
    },
    sourceIds: ['ca.ftb_business_due_dates', 'ca.ftb_568_booklet_2025'],
    evidence: [
      sourceEvidence(
        'ca.ftb_568_booklet_2025',
        'LLC fee',
        'FTB requires estimating and paying the LLC fee by the 15th day of the 6th month of the current taxable year.',
      ),
    ],
    defaultTip: 'Mark for review when California-source total income is unknown.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ca.100s.return.2025',
    title: 'California S corporation Form 100S return',
    jurisdiction: 'CA',
    entityApplicability: ['s_corp'],
    taxType: 'ca_100s',
    formName: 'Form 100S',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'nth_day_after_tax_year_end',
      monthOffset: 3,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      durationMonths: 6,
      paymentExtended: false,
      notes: 'FTB lists separate payment due date at the original return date.',
    },
    sourceIds: ['ca.ftb_business_due_dates'],
    evidence: [
      sourceEvidence(
        'ca.ftb_business_due_dates',
        'Corporation tax return and payments / S corporation',
        'Return and payment are due in the 3rd month after tax year close.',
      ),
    ],
    defaultTip: 'Calendar-year 2025 CA S corporation return rolls to March 16, 2026.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ca.100.return.2025',
    title: 'California C corporation Form 100 return',
    jurisdiction: 'CA',
    entityApplicability: ['c_corp'],
    taxType: 'ca_100',
    formName: 'Form 100',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'nth_day_after_tax_year_end',
      monthOffset: 4,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      durationMonths: 7,
      paymentExtended: false,
      notes: 'Tax year 2019 and later has the 15th day of the 11th month extended due date.',
    },
    sourceIds: ['ca.ftb_business_due_dates'],
    evidence: [
      sourceEvidence(
        'ca.ftb_business_due_dates',
        'Corporation tax return and payments / C corporation',
        'FTB lists return and payment in the 4th month after close.',
      ),
    ],
    defaultTip: 'Calendar-year CA C corporation return is due April 15, 2026.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ny.it204.return.2025',
    title: 'New York partnership return',
    jurisdiction: 'NY',
    entityApplicability: ['partnership', 'llc'],
    taxType: 'ny_it204',
    formName: 'Form IT-204',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'fixed_date',
      date: '2026-03-16',
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: true,
      formName: 'Form IT-370-PF',
      durationMonths: 6,
      paymentExtended: false,
      notes: 'Extension must be filed by the return due date.',
    },
    sourceIds: ['ny.tax_calendar_2026', 'ny.it204ll'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar_2026',
        'March 16 entries',
        'NY calendar lists partnership tax return due for calendar-year filers.',
      ),
      sourceEvidence(
        'ny.it204ll',
        'When to file',
        'IT-204-LL instructions cross-reference the partnership return due date.',
      ),
    ],
    defaultTip: 'NY calendar-year partnership returns for 2025 are due March 16, 2026.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ny.it204ll.filing_fee.2025',
    title: 'New York partnership, LLC, and LLP filing fee',
    jurisdiction: 'NY',
    entityApplicability: ['partnership', 'llc'],
    taxType: 'ny_it204ll',
    formName: 'Form IT-204-LL',
    eventType: 'payment',
    isFiling: true,
    isPayment: true,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'applicability_review',
    status: 'verified',
    coverageStatus: 'manual',
    riskLevel: 'high',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'nth_day_after_tax_year_end',
      monthOffset: 3,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'NY instructions state there is no extension for Form IT-204-LL or the annual fee.',
    },
    sourceIds: ['ny.tax_calendar_2026', 'ny.it204ll'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar_2026',
        'March 16 entries',
        'NY calendar lists partnership, LLC, and LLP filing fee due.',
      ),
      sourceEvidence(
        'ny.it204ll',
        'General information / When to file',
        'Instructions define the annual fee and no-extension treatment.',
      ),
    ],
    defaultTip: 'Do not treat IT-204-LL as covered by a partnership filing extension.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ny.ct3.return.2025',
    title: 'New York C corporation tax return',
    jurisdiction: 'NY',
    entityApplicability: ['c_corp'],
    taxType: 'ny_ct3',
    formName: 'Form CT-3',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'fixed_date',
      date: '2026-04-15',
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: true,
      durationMonths: 6,
      paymentExtended: false,
      notes: 'Calendar-year return due date is from NY calendar and Article 9-A guidance.',
    },
    sourceIds: ['ny.tax_calendar_2026', 'ny.article_9a'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar_2026',
        'April 15 entries',
        'NY calendar lists C corporation return due for calendar-year filers.',
      ),
      sourceEvidence(
        'ny.article_9a',
        'Filing frequency table',
        'Article 9-A page lists calendar-year due date on April 15.',
      ),
    ],
    defaultTip: 'Calendar-year NY C corporation returns are due April 15, 2026.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ny.ptet.return_extension.2025',
    title: 'New York PTET annual return or extension',
    jurisdiction: 'NY',
    entityApplicability: ['partnership', 's_corp'],
    taxType: 'ny_ptet',
    formName: 'PTET annual return',
    eventType: 'extension',
    isFiling: true,
    isPayment: true,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'applicability_review',
    status: 'verified',
    coverageStatus: 'manual',
    riskLevel: 'high',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'fixed_date',
      date: '2026-03-16',
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: true,
      durationMonths: 6,
      paymentExtended: false,
      notes: 'PTET extension is filing-only; tax must be paid by original due date.',
    },
    sourceIds: ['ny.tax_calendar_2026', 'ny.ptet'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar_2026',
        'March 16 entries',
        'NY calendar lists PTET return or automatic extension request due.',
      ),
      sourceEvidence('ny.ptet', 'Extension', 'PTET extension does not extend time to pay.'),
    ],
    defaultTip: 'Only clients with a PTET election should receive this obligation.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'tx.franchise.annual_report.2026',
    title: 'Texas annual franchise tax report',
    jurisdiction: 'TX',
    entityApplicability: ['llc', 'partnership', 's_corp', 'c_corp'],
    taxType: 'tx_franchise_tax',
    formName: 'Texas franchise tax report',
    eventType: 'filing',
    isFiling: true,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'annual_rolling',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'fixed_date',
      date: '2026-05-15',
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      paymentExtended: false,
      notes: 'Timely extension request must be received or postmarked by the original due date.',
    },
    sourceIds: ['tx.franchise_overview', 'tx.annual_report'],
    evidence: [
      sourceEvidence(
        'tx.franchise_overview',
        'Due Dates, Extensions and Filing Methods',
        'Texas lists franchise tax reports as due May 15 each year.',
      ),
      sourceEvidence(
        'tx.annual_report',
        'Annual Report Instructions',
        'Annual reports are due May 15 of each year.',
      ),
    ],
    defaultTip:
      'Confirm whether the entity is subject to Texas franchise tax before generating reminders.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'tx.franchise.pir_oir.2026',
    title: 'Texas PIR or OIR information report',
    jurisdiction: 'TX',
    entityApplicability: ['llc', 'partnership', 's_corp', 'c_corp'],
    taxType: 'tx_franchise_information_report',
    formName: 'PIR/OIR',
    eventType: 'information_report',
    isFiling: true,
    isPayment: false,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'basic',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'fixed_date',
      date: '2026-05-15',
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      paymentExtended: false,
      notes: 'Information report follows annual franchise tax report due date.',
    },
    sourceIds: ['tx.annual_report', 'tx.pir_oir'],
    evidence: [
      sourceEvidence(
        'tx.pir_oir',
        'Filing Requirements',
        'PIR is due on the annual franchise tax report due date.',
      ),
      sourceEvidence(
        'tx.annual_report',
        'Information Report',
        'Instructions distinguish PIR and OIR by entity type.',
      ),
    ],
    defaultTip: 'Use entity type to decide PIR vs OIR before showing client-facing language.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'fl.f1120.return.2025',
    title: 'Florida corporate income/franchise tax return',
    jurisdiction: 'FL',
    entityApplicability: ['c_corp'],
    taxType: 'fl_f1120',
    formName: 'Form F-1120',
    eventType: 'filing',
    isFiling: true,
    isPayment: true,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'annual_rolling',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: false,
    dueDateLogic: {
      kind: 'source_defined_calendar',
      description: 'Use Florida DOR corporate income tax due-date table by taxable year end.',
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: true,
      formName: 'Form F-7004',
      durationMonths: 6,
      paymentExtended: false,
      notes: 'Florida F-7004 must include tentative tax payment by original due date.',
    },
    sourceIds: ['fl.cit', 'fl.cit_due_dates_2026'],
    evidence: [
      sourceEvidence(
        'fl.cit',
        'Extension of Time and Payment of Tentative Tax',
        'F-7004 is filed with tentative payment by the original due date.',
      ),
      sourceEvidence(
        'fl.cit_due_dates_2026',
        'Corporate Income Tax Due Dates',
        'Florida publishes a taxable-year-end due-date table.',
      ),
    ],
    defaultTip: 'Use the Florida taxable-year-end table before assigning a concrete due date.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'fl.cit.estimated_tax.2026',
    title: 'Florida corporate estimated income/franchise tax',
    jurisdiction: 'FL',
    entityApplicability: ['c_corp'],
    taxType: 'fl_cit_estimated_tax',
    formName: 'Form F-1120ES',
    eventType: 'payment',
    isFiling: false,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'annual_rolling',
    status: 'verified',
    coverageStatus: 'manual',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'source_defined_calendar',
      description:
        'Estimated tax schedule depends on taxable year begin/end and Florida threshold.',
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'Estimated tax is payment-only and threshold-dependent.',
    },
    sourceIds: ['fl.cit', 'fl.cit_due_dates_2026'],
    evidence: [
      sourceEvidence(
        'fl.cit',
        'Estimated Tax',
        'Florida estimated tax applies when annual corporate income tax exceeds the threshold.',
      ),
      sourceEvidence(
        'fl.cit_due_dates_2026',
        'Estimated tax due dates table',
        'Florida publishes installment due dates by taxable year end.',
      ),
    ],
    defaultTip: 'Only generate when estimated Florida corporate income tax exceeds the threshold.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'wa.excise.monthly.2026',
    title: 'Washington combined excise tax monthly return',
    jurisdiction: 'WA',
    entityApplicability: ['any_business'],
    taxType: 'wa_combined_excise_monthly',
    formName: 'Combined Excise Tax Return',
    eventType: 'filing',
    isFiling: true,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'annual_rolling',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'period_table',
      frequency: 'monthly',
      periods: [
        { period: '2026-01', dueDate: '2026-02-25' },
        { period: '2026-02', dueDate: '2026-03-25' },
        { period: '2026-03', dueDate: '2026-04-25' },
        { period: '2026-04', dueDate: '2026-05-25' },
        { period: '2026-05', dueDate: '2026-06-25' },
        { period: '2026-06', dueDate: '2026-07-25' },
        { period: '2026-07', dueDate: '2026-08-25' },
        { period: '2026-08', dueDate: '2026-09-25' },
        { period: '2026-09', dueDate: '2026-10-25' },
        { period: '2026-10', dueDate: '2026-11-25' },
        { period: '2026-11', dueDate: '2026-12-25' },
        { period: '2026-12', dueDate: '2027-01-25' },
      ],
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes:
        'Washington DOR source table already reflects penalty start dates and rollover context.',
    },
    sourceIds: ['wa.excise_due_dates_2026', 'wa.bo'],
    evidence: [
      sourceEvidence(
        'wa.excise_due_dates_2026',
        'Monthly due dates',
        'Washington publishes each monthly return due date for 2026.',
      ),
      sourceEvidence(
        'wa.bo',
        'B&O tax',
        'B&O applicability depends on business activity and filing frequency.',
      ),
    ],
    defaultTip: 'Confirm the client filing frequency before generating monthly excise reminders.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'wa.excise.quarterly.2026',
    title: 'Washington combined excise tax quarterly return',
    jurisdiction: 'WA',
    entityApplicability: ['any_business'],
    taxType: 'wa_combined_excise_quarterly',
    formName: 'Combined Excise Tax Return',
    eventType: 'filing',
    isFiling: true,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'annual_rolling',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'period_table',
      frequency: 'quarterly',
      periods: [
        { period: '2026-Q1', dueDate: '2026-04-30' },
        { period: '2026-Q2', dueDate: '2026-07-31' },
        { period: '2026-Q3', dueDate: '2026-10-31' },
        { period: '2026-Q4', dueDate: '2027-01-31' },
      ],
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'Quarterly due dates are source-defined by Washington DOR.',
    },
    sourceIds: ['wa.excise_due_dates_2026', 'wa.bo'],
    evidence: [
      sourceEvidence(
        'wa.excise_due_dates_2026',
        'Quarterly due dates',
        'Washington publishes quarterly return due dates for 2026.',
      ),
    ],
    defaultTip: 'Use the quarterly schedule only after confirming filing frequency.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'wa.excise.annual.2026',
    title: 'Washington combined excise tax annual return',
    jurisdiction: 'WA',
    entityApplicability: ['any_business'],
    taxType: 'wa_combined_excise_annual',
    formName: 'Combined Excise Tax Return',
    eventType: 'filing',
    isFiling: true,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'annual_rolling',
    status: 'verified',
    coverageStatus: 'full',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'period_table',
      frequency: 'annual',
      periods: [{ period: '2026', dueDate: '2027-04-15' }],
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'Annual due date is source-defined by Washington DOR.',
    },
    sourceIds: ['wa.excise_due_dates_2026', 'wa.bo'],
    evidence: [
      sourceEvidence(
        'wa.excise_due_dates_2026',
        'Annual 2026 due date',
        'Washington lists the annual 2026 due date for the Combined Excise Tax Return.',
      ),
    ],
    defaultTip: 'Annual Washington excise return for 2026 is due April 15, 2027.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
] as const satisfies readonly ObligationRule[]

export function listRuleSources(jurisdiction?: RuleJurisdiction): readonly RuleSource[] {
  if (!jurisdiction) return RULE_SOURCES
  return RULE_SOURCES.filter((source) => source.jurisdiction === jurisdiction)
}

export function listObligationRules(
  input: {
    jurisdiction?: RuleJurisdiction
    status?: RuleStatus
    includeCandidates?: boolean
  } = {},
): readonly ObligationRule[] {
  const includeCandidates = input.includeCandidates ?? false

  return OBLIGATION_RULES.filter((rule) => {
    if (input.jurisdiction && rule.jurisdiction !== input.jurisdiction) return false
    if (input.status && rule.status !== input.status) return false
    if (!includeCandidates && rule.status === 'candidate') return false
    return true
  })
}

export function findRuleById(id: string): ObligationRule | undefined {
  return OBLIGATION_RULES.find((rule) => rule.id === id)
}

export function listSourcesByNotificationChannel(
  channel: RuleNotificationChannel,
): readonly RuleSource[] {
  return RULE_SOURCES.filter((source) => {
    const channels: readonly RuleNotificationChannel[] = source.notificationChannels
    return channels.includes(channel)
  })
}

export function getMvpRuleCoverage(): readonly {
  jurisdiction: RuleJurisdiction
  sourceCount: number
  verifiedRuleCount: number
  candidateCount: number
  highPrioritySourceCount: number
}[] {
  return MVP_RULE_JURISDICTIONS.map((jurisdiction) => {
    const sources = listRuleSources(jurisdiction)
    const rules = OBLIGATION_RULES.filter((rule) => rule.jurisdiction === jurisdiction)
    return {
      jurisdiction,
      sourceCount: sources.length,
      verifiedRuleCount: rules.filter((rule) => rule.status === 'verified').length,
      candidateCount: rules.filter((rule) => rule.status === 'candidate').length,
      highPrioritySourceCount: sources.filter(
        (source) => source.priority === 'critical' || source.priority === 'high',
      ).length,
    }
  })
}
