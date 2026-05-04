import { expandDueDateLogic } from '../date-logic'

export const STATE_RULE_JURISDICTIONS = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'DC',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
] as const

export const MVP_RULE_JURISDICTIONS = ['FED', ...STATE_RULE_JURISDICTIONS] as const

export type RuleJurisdiction = (typeof MVP_RULE_JURISDICTIONS)[number]
export type RuleGenerationState = (typeof STATE_RULE_JURISDICTIONS)[number]

export type RuleSourceType =
  | 'publication'
  | 'instructions'
  | 'due_dates'
  | 'calendar'
  | 'emergency_relief'
  | 'news'
  | 'form'
  | 'early_warning'
  | 'subscription'

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

export type RuleEvidenceAuthorityRole = 'basis' | 'cross_check' | 'watch' | 'early_warning'

export interface RuleEvidenceLocator {
  kind: 'html' | 'pdf' | 'table' | 'api' | 'email_subscription'
  heading?: string
  selector?: string
  pdfPage?: number
  tableLabel?: string
  rowLabel?: string
}

export interface RuleEvidence {
  sourceId: string
  authorityRole: RuleEvidenceAuthorityRole
  locator: RuleEvidenceLocator
  summary: string
  sourceExcerpt: string
  retrievedAt: string
  sourceUpdatedOn?: string
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

export type RuleGenerationEntity = Exclude<EntityApplicability, 'any_business'> | 'other'

export interface RuleGenerationClientFacts {
  id: string
  entityType: RuleGenerationEntity
  state: RuleGenerationState
  taxTypes: readonly string[]
  taxYearStart?: string
  taxYearEnd?: string
}

export interface RuleGenerationInput {
  client: RuleGenerationClientFacts
  rules?: readonly ObligationRule[]
  holidays?: readonly string[]
}

export interface RuleTaxTypeCandidate {
  inputTaxType: string
  taxType: string
  requiresReview: boolean
  reviewReason: string | null
}

export interface ObligationGenerationPreview {
  clientId: string
  ruleId: string
  ruleVersion: number
  ruleTitle: string
  jurisdiction: RuleJurisdiction
  taxType: string
  matchedTaxType: string
  period: string
  dueDate: string | null
  eventType: ObligationEventType
  isFiling: boolean
  isPayment: boolean
  formName: string
  sourceIds: readonly string[]
  evidence: readonly RuleEvidence[]
  requiresReview: boolean
  reminderReady: boolean
  reviewReasons: readonly string[]
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

const RULE_TAX_TYPE_ALIASES: Record<
  string,
  readonly { taxType: string; requiresReview?: boolean; reason?: string }[]
> = {
  ca_100_franchise: [{ taxType: 'ca_100' }],
  ca_100s_franchise: [{ taxType: 'ca_100s' }],
  ca_llc_fee_gross_receipts: [
    {
      taxType: 'ca_llc_estimated_fee',
      requiresReview: true,
      reason: 'ca_llc_fee_depends_on_california_source_income',
    },
  ],
  ca_llc_franchise_min_800: [{ taxType: 'ca_llc_annual_tax' }],
  federal_1065_or_1040: [
    {
      taxType: 'federal_1065',
      requiresReview: true,
      reason: 'llc_federal_classification_required',
    },
  ],
  ny_llc_filing_fee: [
    {
      taxType: 'ny_it204ll',
      requiresReview: true,
      reason: 'ny_it204ll_applicability_required',
    },
  ],
  ny_ptet_optional: [
    {
      taxType: 'ny_ptet_election',
      requiresReview: true,
      reason: 'ny_ptet_election_required',
    },
    {
      taxType: 'ny_ptet_estimated_tax',
      requiresReview: true,
      reason: 'ny_ptet_election_required',
    },
    {
      taxType: 'ny_ptet',
      requiresReview: true,
      reason: 'ny_ptet_election_required',
    },
  ],
  tx_franchise_tax: [
    {
      taxType: 'tx_franchise_report',
      requiresReview: true,
      reason: 'tx_franchise_taxability_required',
    },
    {
      taxType: 'tx_pir_oir',
      requiresReview: true,
      reason: 'tx_information_report_type_required',
    },
  ],
  wa_combined_excise: [
    {
      taxType: 'wa_combined_excise_monthly',
      requiresReview: true,
      reason: 'wa_filing_frequency_required',
    },
    {
      taxType: 'wa_combined_excise_quarterly',
      requiresReview: true,
      reason: 'wa_filing_frequency_required',
    },
    {
      taxType: 'wa_combined_excise_annual',
      requiresReview: true,
      reason: 'wa_filing_frequency_required',
    },
  ],
}

interface StateRuleSourceSeed {
  jurisdiction: RuleGenerationState
  name: string
  taxAgencyTitle: string
  taxAgencyUrl: string
  employerAgencyTitle: string
  employerAgencyUrl: string
}

export const STATE_RULE_SOURCE_SEEDS = [
  {
    jurisdiction: 'AL',
    name: 'Alabama',
    taxAgencyTitle: 'Alabama Department of Revenue',
    taxAgencyUrl: 'https://www.revenue.alabama.gov/',
    employerAgencyTitle: 'Alabama Department of Labor',
    employerAgencyUrl: 'https://www.labor.alabama.gov/',
  },
  {
    jurisdiction: 'AK',
    name: 'Alaska',
    taxAgencyTitle: 'Alaska Department of Revenue Tax Division',
    taxAgencyUrl: 'https://tax.alaska.gov/',
    employerAgencyTitle: 'Alaska Department of Labor and Workforce Development',
    employerAgencyUrl: 'https://labor.alaska.gov/',
  },
  {
    jurisdiction: 'AZ',
    name: 'Arizona',
    taxAgencyTitle: 'Arizona Department of Revenue',
    taxAgencyUrl: 'https://azdor.gov/',
    employerAgencyTitle: 'Arizona Department of Economic Security',
    employerAgencyUrl: 'https://des.az.gov/',
  },
  {
    jurisdiction: 'AR',
    name: 'Arkansas',
    taxAgencyTitle: 'Arkansas Department of Finance and Administration',
    taxAgencyUrl: 'https://www.dfa.arkansas.gov/',
    employerAgencyTitle: 'Arkansas Division of Workforce Services',
    employerAgencyUrl: 'https://dws.arkansas.gov/',
  },
  {
    jurisdiction: 'CA',
    name: 'California',
    taxAgencyTitle: 'California Franchise Tax Board',
    taxAgencyUrl: 'https://www.ftb.ca.gov/',
    employerAgencyTitle: 'California Employment Development Department',
    employerAgencyUrl: 'https://edd.ca.gov/',
  },
  {
    jurisdiction: 'CO',
    name: 'Colorado',
    taxAgencyTitle: 'Colorado Department of Revenue Taxation Division',
    taxAgencyUrl: 'https://tax.colorado.gov/',
    employerAgencyTitle: 'Colorado Department of Labor and Employment',
    employerAgencyUrl: 'https://cdle.colorado.gov/',
  },
  {
    jurisdiction: 'CT',
    name: 'Connecticut',
    taxAgencyTitle: 'Connecticut Department of Revenue Services',
    taxAgencyUrl: 'https://portal.ct.gov/drs',
    employerAgencyTitle: 'Connecticut Department of Labor',
    employerAgencyUrl: 'https://portal.ct.gov/dol',
  },
  {
    jurisdiction: 'DE',
    name: 'Delaware',
    taxAgencyTitle: 'Delaware Division of Revenue',
    taxAgencyUrl: 'https://revenue.delaware.gov/',
    employerAgencyTitle: 'Delaware Department of Labor',
    employerAgencyUrl: 'https://labor.delaware.gov/',
  },
  {
    jurisdiction: 'DC',
    name: 'District of Columbia',
    taxAgencyTitle: 'DC Office of Tax and Revenue',
    taxAgencyUrl: 'https://otr.cfo.dc.gov/',
    employerAgencyTitle: 'DC Department of Employment Services',
    employerAgencyUrl: 'https://does.dc.gov/',
  },
  {
    jurisdiction: 'FL',
    name: 'Florida',
    taxAgencyTitle: 'Florida Department of Revenue',
    taxAgencyUrl: 'https://floridarevenue.com/',
    employerAgencyTitle: 'Florida Department of Commerce Reemployment Assistance',
    employerAgencyUrl: 'https://www.floridajobs.org/',
  },
  {
    jurisdiction: 'GA',
    name: 'Georgia',
    taxAgencyTitle: 'Georgia Department of Revenue',
    taxAgencyUrl: 'https://dor.georgia.gov/',
    employerAgencyTitle: 'Georgia Department of Labor',
    employerAgencyUrl: 'https://dol.georgia.gov/',
  },
  {
    jurisdiction: 'HI',
    name: 'Hawaii',
    taxAgencyTitle: 'Hawaii Department of Taxation',
    taxAgencyUrl: 'https://tax.hawaii.gov/',
    employerAgencyTitle: 'Hawaii Department of Labor and Industrial Relations',
    employerAgencyUrl: 'https://labor.hawaii.gov/',
  },
  {
    jurisdiction: 'ID',
    name: 'Idaho',
    taxAgencyTitle: 'Idaho State Tax Commission',
    taxAgencyUrl: 'https://tax.idaho.gov/',
    employerAgencyTitle: 'Idaho Department of Labor',
    employerAgencyUrl: 'https://labor.idaho.gov/',
  },
  {
    jurisdiction: 'IL',
    name: 'Illinois',
    taxAgencyTitle: 'Illinois Department of Revenue',
    taxAgencyUrl: 'https://tax.illinois.gov/',
    employerAgencyTitle: 'Illinois Department of Employment Security',
    employerAgencyUrl: 'https://ides.illinois.gov/',
  },
  {
    jurisdiction: 'IN',
    name: 'Indiana',
    taxAgencyTitle: 'Indiana Department of Revenue',
    taxAgencyUrl: 'https://www.in.gov/dor/',
    employerAgencyTitle: 'Indiana Department of Workforce Development',
    employerAgencyUrl: 'https://www.in.gov/dwd/',
  },
  {
    jurisdiction: 'IA',
    name: 'Iowa',
    taxAgencyTitle: 'Iowa Department of Revenue',
    taxAgencyUrl: 'https://revenue.iowa.gov/',
    employerAgencyTitle: 'Iowa Workforce Development',
    employerAgencyUrl: 'https://workforce.iowa.gov/',
  },
  {
    jurisdiction: 'KS',
    name: 'Kansas',
    taxAgencyTitle: 'Kansas Department of Revenue',
    taxAgencyUrl: 'https://www.ksrevenue.gov/',
    employerAgencyTitle: 'Kansas Department of Labor',
    employerAgencyUrl: 'https://www.dol.ks.gov/',
  },
  {
    jurisdiction: 'KY',
    name: 'Kentucky',
    taxAgencyTitle: 'Kentucky Department of Revenue',
    taxAgencyUrl: 'https://revenue.ky.gov/',
    employerAgencyTitle: 'Kentucky Career Center Office of Unemployment Insurance',
    employerAgencyUrl: 'https://kcc.ky.gov/',
  },
  {
    jurisdiction: 'LA',
    name: 'Louisiana',
    taxAgencyTitle: 'Louisiana Department of Revenue',
    taxAgencyUrl: 'https://revenue.louisiana.gov/',
    employerAgencyTitle: 'Louisiana Workforce Commission',
    employerAgencyUrl: 'https://www.laworks.net/',
  },
  {
    jurisdiction: 'ME',
    name: 'Maine',
    taxAgencyTitle: 'Maine Revenue Services',
    taxAgencyUrl: 'https://www.maine.gov/revenue/',
    employerAgencyTitle: 'Maine Department of Labor',
    employerAgencyUrl: 'https://www.maine.gov/labor/',
  },
  {
    jurisdiction: 'MD',
    name: 'Maryland',
    taxAgencyTitle: 'Comptroller of Maryland',
    taxAgencyUrl: 'https://www.marylandtaxes.gov/',
    employerAgencyTitle: 'Maryland Department of Labor',
    employerAgencyUrl: 'https://labor.maryland.gov/',
  },
  {
    jurisdiction: 'MA',
    name: 'Massachusetts',
    taxAgencyTitle: 'Massachusetts Department of Revenue',
    taxAgencyUrl: 'https://www.mass.gov/orgs/massachusetts-department-of-revenue',
    employerAgencyTitle: 'Massachusetts Department of Unemployment Assistance',
    employerAgencyUrl: 'https://www.mass.gov/orgs/department-of-unemployment-assistance',
  },
  {
    jurisdiction: 'MI',
    name: 'Michigan',
    taxAgencyTitle: 'Michigan Department of Treasury',
    taxAgencyUrl: 'https://www.michigan.gov/treasury',
    employerAgencyTitle: 'Michigan Unemployment Insurance Agency',
    employerAgencyUrl: 'https://www.michigan.gov/leo/bureaus-agencies/uia',
  },
  {
    jurisdiction: 'MN',
    name: 'Minnesota',
    taxAgencyTitle: 'Minnesota Department of Revenue',
    taxAgencyUrl: 'https://www.revenue.state.mn.us/',
    employerAgencyTitle: 'Minnesota Unemployment Insurance Program',
    employerAgencyUrl: 'https://uimn.org/',
  },
  {
    jurisdiction: 'MS',
    name: 'Mississippi',
    taxAgencyTitle: 'Mississippi Department of Revenue',
    taxAgencyUrl: 'https://www.dor.ms.gov/',
    employerAgencyTitle: 'Mississippi Department of Employment Security',
    employerAgencyUrl: 'https://mdes.ms.gov/',
  },
  {
    jurisdiction: 'MO',
    name: 'Missouri',
    taxAgencyTitle: 'Missouri Department of Revenue',
    taxAgencyUrl: 'https://dor.mo.gov/',
    employerAgencyTitle: 'Missouri Department of Labor and Industrial Relations',
    employerAgencyUrl: 'https://labor.mo.gov/',
  },
  {
    jurisdiction: 'MT',
    name: 'Montana',
    taxAgencyTitle: 'Montana Department of Revenue',
    taxAgencyUrl: 'https://mtrevenue.gov/',
    employerAgencyTitle: 'Montana Department of Labor and Industry',
    employerAgencyUrl: 'https://dli.mt.gov/',
  },
  {
    jurisdiction: 'NE',
    name: 'Nebraska',
    taxAgencyTitle: 'Nebraska Department of Revenue',
    taxAgencyUrl: 'https://revenue.nebraska.gov/',
    employerAgencyTitle: 'Nebraska Department of Labor',
    employerAgencyUrl: 'https://dol.nebraska.gov/',
  },
  {
    jurisdiction: 'NV',
    name: 'Nevada',
    taxAgencyTitle: 'Nevada Department of Taxation',
    taxAgencyUrl: 'https://tax.nv.gov/',
    employerAgencyTitle: 'Nevada Department of Employment, Training and Rehabilitation',
    employerAgencyUrl: 'https://detr.nv.gov/',
  },
  {
    jurisdiction: 'NH',
    name: 'New Hampshire',
    taxAgencyTitle: 'New Hampshire Department of Revenue Administration',
    taxAgencyUrl: 'https://www.revenue.nh.gov/',
    employerAgencyTitle: 'New Hampshire Employment Security',
    employerAgencyUrl: 'https://www.nhes.nh.gov/',
  },
  {
    jurisdiction: 'NJ',
    name: 'New Jersey',
    taxAgencyTitle: 'New Jersey Division of Taxation',
    taxAgencyUrl: 'https://www.nj.gov/treasury/taxation/',
    employerAgencyTitle: 'New Jersey Department of Labor and Workforce Development',
    employerAgencyUrl: 'https://www.nj.gov/labor/',
  },
  {
    jurisdiction: 'NM',
    name: 'New Mexico',
    taxAgencyTitle: 'New Mexico Taxation and Revenue Department',
    taxAgencyUrl: 'https://www.tax.newmexico.gov/',
    employerAgencyTitle: 'New Mexico Department of Workforce Solutions',
    employerAgencyUrl: 'https://www.dws.state.nm.us/',
  },
  {
    jurisdiction: 'NY',
    name: 'New York',
    taxAgencyTitle: 'New York Department of Taxation and Finance',
    taxAgencyUrl: 'https://www.tax.ny.gov/',
    employerAgencyTitle: 'New York Department of Labor',
    employerAgencyUrl: 'https://dol.ny.gov/',
  },
  {
    jurisdiction: 'NC',
    name: 'North Carolina',
    taxAgencyTitle: 'North Carolina Department of Revenue',
    taxAgencyUrl: 'https://www.ncdor.gov/',
    employerAgencyTitle: 'North Carolina Division of Employment Security',
    employerAgencyUrl: 'https://www.des.nc.gov/',
  },
  {
    jurisdiction: 'ND',
    name: 'North Dakota',
    taxAgencyTitle: 'North Dakota Office of State Tax Commissioner',
    taxAgencyUrl: 'https://www.tax.nd.gov/',
    employerAgencyTitle: 'North Dakota Job Service',
    employerAgencyUrl: 'https://www.jobsnd.com/',
  },
  {
    jurisdiction: 'OH',
    name: 'Ohio',
    taxAgencyTitle: 'Ohio Department of Taxation',
    taxAgencyUrl: 'https://tax.ohio.gov/',
    employerAgencyTitle: 'Ohio Department of Job and Family Services',
    employerAgencyUrl: 'https://jfs.ohio.gov/',
  },
  {
    jurisdiction: 'OK',
    name: 'Oklahoma',
    taxAgencyTitle: 'Oklahoma Tax Commission',
    taxAgencyUrl: 'https://oklahoma.gov/tax.html',
    employerAgencyTitle: 'Oklahoma Employment Security Commission',
    employerAgencyUrl: 'https://oklahoma.gov/oesc.html',
  },
  {
    jurisdiction: 'OR',
    name: 'Oregon',
    taxAgencyTitle: 'Oregon Department of Revenue',
    taxAgencyUrl: 'https://www.oregon.gov/dor/',
    employerAgencyTitle: 'Oregon Employment Department',
    employerAgencyUrl: 'https://www.oregon.gov/employ/',
  },
  {
    jurisdiction: 'PA',
    name: 'Pennsylvania',
    taxAgencyTitle: 'Pennsylvania Department of Revenue',
    taxAgencyUrl: 'https://www.pa.gov/agencies/revenue.html',
    employerAgencyTitle: 'Pennsylvania Department of Labor and Industry',
    employerAgencyUrl: 'https://www.pa.gov/agencies/dli.html',
  },
  {
    jurisdiction: 'RI',
    name: 'Rhode Island',
    taxAgencyTitle: 'Rhode Island Division of Taxation',
    taxAgencyUrl: 'https://tax.ri.gov/',
    employerAgencyTitle: 'Rhode Island Department of Labor and Training',
    employerAgencyUrl: 'https://dlt.ri.gov/',
  },
  {
    jurisdiction: 'SC',
    name: 'South Carolina',
    taxAgencyTitle: 'South Carolina Department of Revenue',
    taxAgencyUrl: 'https://dor.sc.gov/',
    employerAgencyTitle: 'South Carolina Department of Employment and Workforce',
    employerAgencyUrl: 'https://dew.sc.gov/',
  },
  {
    jurisdiction: 'SD',
    name: 'South Dakota',
    taxAgencyTitle: 'South Dakota Department of Revenue',
    taxAgencyUrl: 'https://dor.sd.gov/',
    employerAgencyTitle: 'South Dakota Department of Labor and Regulation',
    employerAgencyUrl: 'https://dlr.sd.gov/',
  },
  {
    jurisdiction: 'TN',
    name: 'Tennessee',
    taxAgencyTitle: 'Tennessee Department of Revenue',
    taxAgencyUrl: 'https://www.tn.gov/revenue.html',
    employerAgencyTitle: 'Tennessee Department of Labor and Workforce Development',
    employerAgencyUrl: 'https://www.tn.gov/workforce.html',
  },
  {
    jurisdiction: 'TX',
    name: 'Texas',
    taxAgencyTitle: 'Texas Comptroller of Public Accounts',
    taxAgencyUrl: 'https://comptroller.texas.gov/',
    employerAgencyTitle: 'Texas Workforce Commission',
    employerAgencyUrl: 'https://www.twc.texas.gov/',
  },
  {
    jurisdiction: 'UT',
    name: 'Utah',
    taxAgencyTitle: 'Utah State Tax Commission',
    taxAgencyUrl: 'https://tax.utah.gov/',
    employerAgencyTitle: 'Utah Department of Workforce Services',
    employerAgencyUrl: 'https://jobs.utah.gov/',
  },
  {
    jurisdiction: 'VT',
    name: 'Vermont',
    taxAgencyTitle: 'Vermont Department of Taxes',
    taxAgencyUrl: 'https://tax.vermont.gov/',
    employerAgencyTitle: 'Vermont Department of Labor',
    employerAgencyUrl: 'https://labor.vermont.gov/',
  },
  {
    jurisdiction: 'VA',
    name: 'Virginia',
    taxAgencyTitle: 'Virginia Tax',
    taxAgencyUrl: 'https://www.tax.virginia.gov/',
    employerAgencyTitle: 'Virginia Employment Commission',
    employerAgencyUrl: 'https://www.vec.virginia.gov/',
  },
  {
    jurisdiction: 'WA',
    name: 'Washington',
    taxAgencyTitle: 'Washington Department of Revenue',
    taxAgencyUrl: 'https://dor.wa.gov/',
    employerAgencyTitle: 'Washington Employment Security Department',
    employerAgencyUrl: 'https://esd.wa.gov/',
  },
  {
    jurisdiction: 'WV',
    name: 'West Virginia',
    taxAgencyTitle: 'West Virginia Tax Division',
    taxAgencyUrl: 'https://tax.wv.gov/',
    employerAgencyTitle: 'WorkForce West Virginia',
    employerAgencyUrl: 'https://workforcewv.org/',
  },
  {
    jurisdiction: 'WI',
    name: 'Wisconsin',
    taxAgencyTitle: 'Wisconsin Department of Revenue',
    taxAgencyUrl: 'https://www.revenue.wi.gov/',
    employerAgencyTitle: 'Wisconsin Department of Workforce Development',
    employerAgencyUrl: 'https://dwd.wisconsin.gov/',
  },
  {
    jurisdiction: 'WY',
    name: 'Wyoming',
    taxAgencyTitle: 'Wyoming Department of Revenue',
    taxAgencyUrl: 'https://revenue.wyo.gov/',
    employerAgencyTitle: 'Wyoming Department of Workforce Services',
    employerAgencyUrl: 'https://dws.wyo.gov/',
  },
] as const satisfies readonly StateRuleSourceSeed[]

type StateRuleSourceIds = Readonly<{ taxAgency: string; employerAgency: string }>

export const STATE_RULE_SOURCE_IDS = new Map<RuleGenerationState, StateRuleSourceIds>(
  STATE_RULE_SOURCE_SEEDS.map((seed): readonly [RuleGenerationState, StateRuleSourceIds] => [
    seed.jurisdiction,
    {
      taxAgency: `${seed.jurisdiction.toLowerCase()}.tax_agency`,
      employerAgency: `${seed.jurisdiction.toLowerCase()}.employer_ui_agency`,
    },
  ]),
)

function stateRuleSourceIds(jurisdiction: RuleGenerationState): StateRuleSourceIds {
  const ids = STATE_RULE_SOURCE_IDS.get(jurisdiction)
  if (!ids) throw new Error(`Missing official source ids for ${jurisdiction}`)
  return ids
}

export const STATE_OFFICIAL_SOURCES = STATE_RULE_SOURCE_SEEDS.flatMap<RuleSource>((seed) => [
  {
    id: stateRuleSourceIds(seed.jurisdiction).taxAgency,
    jurisdiction: seed.jurisdiction,
    title: seed.taxAgencyTitle,
    url: seed.taxAgencyUrl,
    sourceType: 'due_dates',
    acquisitionMethod: 'manual_review',
    cadence: 'pre_season',
    priority: 'high',
    healthStatus: 'degraded',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: stateRuleSourceIds(seed.jurisdiction).employerAgency,
    jurisdiction: seed.jurisdiction,
    title: seed.employerAgencyTitle,
    url: seed.employerAgencyUrl,
    sourceType: 'due_dates',
    acquisitionMethod: 'manual_review',
    cadence: 'pre_season',
    priority: 'medium',
    healthStatus: 'degraded',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
])

export const RULE_SOURCES = [
  ...STATE_OFFICIAL_SOURCES,
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
    id: 'fed.irs_i1065_2025',
    jurisdiction: 'FED',
    title: 'IRS Instructions for Form 1065 (2025)',
    url: 'https://www.irs.gov/instructions/i1065',
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
    id: 'fed.irs_i1120s_2025',
    jurisdiction: 'FED',
    title: 'IRS Instructions for Form 1120-S (2025)',
    url: 'https://www.irs.gov/instructions/i1120s',
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
    id: 'fed.irs_i1120_2025',
    jurisdiction: 'FED',
    title: 'IRS Instructions for Form 1120 (2025)',
    url: 'https://www.irs.gov/instructions/i1120',
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
    url: 'https://www.ftb.ca.gov/file/business/types/limited-liability-company/index.html',
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
    id: 'ny.tax_calendar.2026',
    jurisdiction: 'NY',
    title: 'New York 2026 Tax Filing Dates',
    url: 'https://www.tax.ny.gov/help/calendar/2026.htm',
    sourceType: 'calendar',
    acquisitionMethod: 'html_watch',
    cadence: 'weekly',
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
    title: 'New York Partnership, LLC, and LLP Annual Filing Fee',
    url: 'https://www.tax.ny.gov/pit/efile/annual_filing_fee.htm',
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
    id: 'ny.partnerships',
    jurisdiction: 'NY',
    title: 'New York Partnerships',
    url: 'https://www.tax.ny.gov/pit/efile/partneridx.htm',
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
    id: 'ny.email_services',
    jurisdiction: 'NY',
    title: 'New York Tax Department Email Services',
    url: 'https://www.tax.ny.gov/help/subscribe.htm',
    sourceType: 'subscription',
    acquisitionMethod: 'email_subscription',
    cadence: 'weekly',
    priority: 'medium',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review'],
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
    sourceType: 'publication',
    acquisitionMethod: 'html_watch',
    cadence: 'quarterly',
    priority: 'critical',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'tx.franchise_home',
    jurisdiction: 'TX',
    title: 'Texas Comptroller Franchise Tax',
    url: 'https://comptroller.texas.gov/taxes/franchise/index.php/taxes/franchise/questionnaire.php',
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
    id: 'tx.franchise_annual_report',
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
    id: 'tx.franchise_extensions',
    jurisdiction: 'TX',
    title: 'Texas Franchise Tax Extensions',
    url: 'https://comptroller.texas.gov/taxes/franchise/filing-extensions.php/1000',
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
    id: 'tx.franchise_forms_2026',
    jurisdiction: 'TX',
    title: 'Texas Franchise Tax Report Forms for 2026',
    url: 'https://comptroller.texas.gov/taxes/franchise/forms/2026-franchise.php',
    sourceType: 'form',
    acquisitionMethod: 'html_watch',
    cadence: 'weekly',
    priority: 'high',
    healthStatus: 'healthy',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review', 'publish_preview'],
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
    sourceType: 'calendar',
    acquisitionMethod: 'manual_review',
    cadence: 'weekly',
    priority: 'critical',
    healthStatus: 'degraded',
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
    acquisitionMethod: 'manual_review',
    cadence: 'quarterly',
    priority: 'high',
    healthStatus: 'degraded',
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
    acquisitionMethod: 'manual_review',
    cadence: 'weekly',
    priority: 'high',
    healthStatus: 'degraded',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review'],
    lastReviewedOn: VERIFIED_AT,
  },
  {
    id: 'wa.capital_gains_exception_2026',
    jurisdiction: 'WA',
    title: 'Washington Capital Gains Excise Tax Due Date Moved to May 1, 2026',
    url: 'https://dor.wa.gov/about/news-releases/2026/capital-gains-excise-tax-returns-due-date-moved-may-1-2026',
    sourceType: 'news',
    acquisitionMethod: 'manual_review',
    cadence: 'weekly',
    priority: 'medium',
    healthStatus: 'degraded',
    isEarlyWarning: false,
    notificationChannels: ['ops_source_change', 'candidate_review', 'publish_preview'],
    lastReviewedOn: VERIFIED_AT,
  },
] as const satisfies readonly RuleSource[]

// `sourceExcerpt` is a representative content snippet from each official
// page — paraphrased or near-verbatim, not always a literal quote. Authored
// by hand based on a live read of each URL on `VERIFIED_AT` (see
// `docs/dev-log/2026-04-27-rules-data-audit.md`). Pages whose body is dynamic
// (news indexes, subscription / disaster watch channels) carry the page-level
// summary because there is no stable paragraph to quote.
const SOURCE_EXCERPTS: Record<string, string> = {
  'fed.irs_pub_509_2026':
    'If any due date falls on a Saturday, Sunday, or legal holiday, the return is timely if filed the next business day.',
  'fed.irs_i7004_2025':
    'Form 7004 does not extend the time for payment of tax. An extension to file is not an extension to pay.',
  'fed.irs_i1065_2025':
    'Generally, a domestic partnership must file Form 1065 by the 15th day of the 3rd month following the date its tax year ended.',
  'fed.irs_i1120s_2025':
    'A corporation must file Form 1120-S by the 15th day of the 3rd month following the close of its tax year.',
  'fed.irs_i1120_2025':
    'A corporation must file Form 1120 by the 15th day of the 4th month after the end of its tax year.',
  'fed.irs_disaster_relief':
    'IRS publishes notice-specific tax relief by date, listing affected localities and postponed acts.',
  'fed.fema_disaster_declarations':
    'OpenFEMA disaster declarations dataset; early-warning signal for IRS / state relief follow-up.',
  'ca.ftb_business_due_dates':
    'If the due date falls on a weekend or holiday, you have until the next business day to file and pay.',
  'ca.ftb_llc':
    'FTB LLC overview page: classification, annual tax, LLC fee, Form 568 filing requirements.',
  'ca.ftb_568_booklet_2025':
    'Form 568 instructions distinguish partnership-classified LLCs from SMLLCs for original return due dates.',
  'ca.ftb_emergency_tax_relief':
    'FTB emergency tax relief page lists postponed deadlines for declared disasters; eligibility is per-event.',
  'ca.ftb_tax_news':
    'FTB Tax News index; new entries trigger candidate review before any rule change.',
  'ny.tax_calendar.2026':
    'If the due date of the return falls on a Saturday, Sunday, or legal holiday, it is due on the next business day.',
  'ny.ptet':
    'PTET is an optional annual entity-level election; eligible entities must opt in by the annual election deadline.',
  'ny.it204ll':
    'There is no extension of time to file Form IT-204-LL or to pay the annual filing fee.',
  'ny.partnerships':
    'NY partnership filing guidance; partnership return due dates follow the partnership tax year close.',
  'ny.email_services': 'NY Tax Department email subscription channel; not a primary basis source.',
  'ny.article_9a':
    'Article 9-A franchise tax on general business corporations; calendar-year due date is April 15.',
  'tx.franchise_overview':
    'Franchise tax reports are due on May 15 each year. If May 15 falls on a Saturday, Sunday or legal holiday, the next business day becomes the due date.',
  'tx.franchise_home':
    'Texas Franchise Tax landing page; canonical entry for forms, due dates, and No Tax Due reporting.',
  'tx.franchise_annual_report':
    'Annual Report Instructions; PIR and OIR distinguished by entity type.',
  'tx.franchise_extensions':
    'Comptroller will tentatively grant an extension upon timely receipt of the appropriate form by the original report due date.',
  'tx.franchise_forms_2026':
    '2026 Franchise Tax Report forms; report-year forms define No Tax Due availability and reporting changes.',
  'tx.pir_oir':
    'PIR is filed by corporations and LLCs; OIR is filed by other entity types. Both follow the franchise tax report due date.',
  'fl.cit':
    'Florida corporate income/franchise tax is imposed on all corporations for the privilege of conducting business in Florida.',
  'fl.cit_due_dates_2026':
    'Florida DOR publishes a taxable-year-end due-date table for corporate income tax returns and estimated payments.',
  'fl.tips':
    'Florida Tax Information Publications index; new entries trigger candidate review before any rule change.',
  'wa.excise_due_dates_2026':
    '2026 Excise Tax Return Due Dates; manual review required (DOR blocks machine fetches).',
  'wa.bo': 'B&O tax applicability depends on business activity and assigned filing frequency.',
  'wa.news':
    'WA DOR news releases index; new entries trigger candidate review before any rule change.',
  'wa.capital_gains_exception_2026':
    'Tax Year 2025 Capital Gains tax returns and payments are due May 1, 2026. A filing extension does not extend the due date for paying the capital gains tax.',
}

function locatorKindForSource(source: RuleSource | undefined): RuleEvidenceLocator['kind'] {
  if (!source) return 'html'
  if (source.acquisitionMethod === 'api_watch') return 'api'
  if (source.acquisitionMethod === 'pdf_watch') return 'pdf'
  if (source.acquisitionMethod === 'email_subscription') return 'email_subscription'
  if (source.sourceType === 'calendar' || source.sourceType === 'due_dates') return 'table'
  return 'html'
}

function authorityRoleForSource(source: RuleSource | undefined): RuleEvidenceAuthorityRole {
  if (source?.isEarlyWarning) return 'early_warning'
  if (source?.sourceType === 'news' || source?.sourceType === 'emergency_relief') return 'watch'
  return 'basis'
}

function sourceEvidence(
  sourceId: string,
  heading: string,
  summary: string,
  options: {
    authorityRole?: RuleEvidenceAuthorityRole
    locatorKind?: RuleEvidenceLocator['kind']
    sourceExcerpt?: string
    sourceUpdatedOn?: string
    pdfPage?: number
    tableLabel?: string
    rowLabel?: string
  } = {},
): RuleEvidence {
  const source = RULE_SOURCES.find((item) => item.id === sourceId)
  const locator: RuleEvidenceLocator = {
    kind: options.locatorKind ?? locatorKindForSource(source),
    heading,
  }

  if (options.pdfPage !== undefined) locator.pdfPage = options.pdfPage
  if (options.tableLabel !== undefined) locator.tableLabel = options.tableLabel
  if (options.rowLabel !== undefined) locator.rowLabel = options.rowLabel

  const evidence: RuleEvidence = {
    sourceId,
    authorityRole: options.authorityRole ?? authorityRoleForSource(source),
    locator,
    summary,
    sourceExcerpt: options.sourceExcerpt ?? SOURCE_EXCERPTS[sourceId] ?? summary,
    retrievedAt: VERIFIED_AT,
  }

  const sourceUpdatedOn = options.sourceUpdatedOn ?? source?.lastReviewedOn
  if (sourceUpdatedOn !== undefined) evidence.sourceUpdatedOn = sourceUpdatedOn

  return evidence
}

const PENDING_REVIEW_QUALITY: RuleQualityChecklist = {
  filingPaymentDistinguished: false,
  extensionHandled: false,
  calendarFiscalSpecified: false,
  holidayRolloverHandled: false,
  crossVerified: false,
  exceptionChannel: true,
}

interface StateCandidateRuleDomain {
  slug: string
  title: string
  taxType: string
  formName: string
  eventType: ObligationEventType
  isFiling: boolean
  isPayment: boolean
  entityApplicability: readonly EntityApplicability[]
  sourceKind: 'taxAgency' | 'employerAgency'
  reviewReason: string
}

const STATE_CANDIDATE_RULE_DOMAINS = [
  {
    slug: 'individual_income_return',
    title: 'individual income tax return applicability',
    taxType: 'state_individual_income_tax',
    formName: 'State individual income tax return',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    entityApplicability: ['individual'],
    sourceKind: 'taxAgency',
    reviewReason:
      'Confirm state personal income tax filing requirement, due date, extension, and no-tax status where applicable.',
  },
  {
    slug: 'individual_estimated_tax',
    title: 'individual estimated tax payment schedule',
    taxType: 'state_individual_estimated_tax',
    formName: 'State individual estimated tax',
    eventType: 'payment',
    isFiling: false,
    isPayment: true,
    entityApplicability: ['individual', 'sole_prop'],
    sourceKind: 'taxAgency',
    reviewReason:
      'Confirm state estimated tax thresholds, installment schedule, weekend/holiday rollover, and no-tax status where applicable.',
  },
  {
    slug: 'fiduciary_income_return',
    title: 'fiduciary income tax return applicability',
    taxType: 'state_fiduciary_income_tax',
    formName: 'State fiduciary income tax return',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    entityApplicability: ['trust'],
    sourceKind: 'taxAgency',
    reviewReason:
      'Confirm state fiduciary income tax filing requirement, due date, extension, and beneficiary reporting requirements.',
  },
  {
    slug: 'business_income_franchise',
    title: 'business income, franchise, or gross receipts return',
    taxType: 'state_business_income_franchise_tax',
    formName: 'State business income/franchise tax return',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    entityApplicability: ['llc', 'partnership', 's_corp', 'c_corp', 'any_business'],
    sourceKind: 'taxAgency',
    reviewReason:
      'Confirm entity-specific income, franchise, gross receipts, B&O, CAT, or business privilege tax rules before publishing deadlines.',
  },
  {
    slug: 'pte_composite_ptet',
    title: 'pass-through, composite, or elective PTE tax',
    taxType: 'state_pte_composite_ptet',
    formName: 'State pass-through/composite/PTE tax filing',
    eventType: 'election',
    isFiling: true,
    isPayment: false,
    entityApplicability: ['llc', 'partnership', 's_corp'],
    sourceKind: 'taxAgency',
    reviewReason:
      'Confirm whether the state has composite return, PTE election, owner consent, and payment due-date requirements.',
  },
  {
    slug: 'sales_use_tax',
    title: 'sales and use tax recurring return',
    taxType: 'state_sales_use_tax',
    formName: 'State sales/use tax return',
    eventType: 'filing',
    isFiling: true,
    isPayment: true,
    entityApplicability: ['any_business'],
    sourceKind: 'taxAgency',
    reviewReason:
      'Confirm seller nexus, assigned filing frequency, zero-return requirement, and source-defined due dates.',
  },
  {
    slug: 'withholding_tax',
    title: 'employer withholding recurring return',
    taxType: 'state_withholding_tax',
    formName: 'State employer withholding return',
    eventType: 'filing',
    isFiling: true,
    isPayment: true,
    entityApplicability: ['any_business'],
    sourceKind: 'taxAgency',
    reviewReason:
      'Confirm employer withholding registration, assigned filing frequency, deposit schedule, and annual reconciliation requirements.',
  },
  {
    slug: 'ui_wage_report',
    title: 'unemployment insurance wage report',
    taxType: 'state_ui_wage_report',
    formName: 'State unemployment insurance wage report',
    eventType: 'filing',
    isFiling: true,
    isPayment: true,
    entityApplicability: ['any_business'],
    sourceKind: 'employerAgency',
    reviewReason:
      'Confirm unemployment insurance registration, quarterly wage report due date, contribution payment rules, and agency-specific filing channel.',
  },
] as const satisfies readonly StateCandidateRuleDomain[]

function buildStateCandidateRule(
  seed: (typeof STATE_RULE_SOURCE_SEEDS)[number],
  domain: StateCandidateRuleDomain,
): ObligationRule {
  const sourceId = stateRuleSourceIds(seed.jurisdiction)[domain.sourceKind]
  return {
    id: `${seed.jurisdiction.toLowerCase()}.${domain.slug}.candidate.2026`,
    title: `${seed.name} ${domain.title}`,
    jurisdiction: seed.jurisdiction,
    entityApplicability: domain.entityApplicability,
    taxType: `${seed.jurisdiction.toLowerCase()}_${domain.taxType}`,
    formName: domain.formName,
    eventType: domain.eventType,
    isFiling: domain.isFiling,
    isPayment: domain.isPayment,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'applicability_review',
    status: 'candidate',
    coverageStatus: 'manual',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'source_defined_calendar',
      description: `${seed.name} ${domain.title} requires official-source review before a concrete deadline can be published.`,
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'Pending official-source review; do not assume filing or payment extension behavior.',
    },
    sourceIds: [sourceId],
    evidence: [
      sourceEvidence(sourceId, domain.formName, domain.reviewReason, {
        authorityRole: 'watch',
        sourceExcerpt: `${seed.name} official source registered for ${domain.title}; candidate rules require ops verification before customer reminders.`,
      }),
    ],
    defaultTip: domain.reviewReason,
    quality: PENDING_REVIEW_QUALITY,
    verifiedBy: 'ops.rules.pending_official_review',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  }
}

export const STATE_CANDIDATE_RULES = STATE_RULE_SOURCE_SEEDS.flatMap((seed) =>
  STATE_CANDIDATE_RULE_DOMAINS.map((domain) => buildStateCandidateRule(seed, domain)),
)

export const OBLIGATION_RULES = [
  ...STATE_CANDIDATE_RULES,
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
    requiresApplicabilityReview: true,
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
    sourceIds: ['fed.irs_pub_509_2026', 'fed.irs_i1065_2025', 'fed.irs_i7004_2025'],
    evidence: [
      sourceEvidence(
        'fed.irs_i1065_2025',
        'When To File',
        'Form 1065 instructions provide the form-specific partnership filing deadline.',
      ),
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
    sourceIds: ['fed.irs_pub_509_2026', 'fed.irs_i1120s_2025', 'fed.irs_i7004_2025'],
    evidence: [
      sourceEvidence(
        'fed.irs_i1120s_2025',
        'When To File',
        'Form 1120-S instructions provide the form-specific S corporation filing deadline.',
      ),
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
    coverageStatus: 'manual',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
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
    sourceIds: ['fed.irs_pub_509_2026', 'fed.irs_i1120_2025', 'fed.irs_i7004_2025'],
    evidence: [
      sourceEvidence(
        'fed.irs_i1120_2025',
        'When To File',
        'Form 1120 instructions provide the form-specific C corporation filing deadline.',
      ),
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
    sourceIds: ['fed.irs_pub_509_2026', 'fed.irs_i1120_2025'],
    evidence: [
      sourceEvidence(
        'fed.irs_i1120_2025',
        'Estimated Tax Payments',
        'Form 1120 instructions identify estimated tax as a corporation payment obligation.',
      ),
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
    ruleTier: 'applicability_review',
    status: 'verified',
    coverageStatus: 'manual',
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
    sourceIds: ['ca.ftb_business_due_dates', 'ca.ftb_568_booklet_2025', 'ca.ftb_llc'],
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
      sourceEvidence(
        'ca.ftb_llc',
        'LLC overview',
        'FTB LLC overview cross-checks Form 568 filing path against LLC classification and ownership type.',
        { authorityRole: 'cross_check' },
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
    sourceIds: ['ca.ftb_business_due_dates', 'ca.ftb_568_booklet_2025', 'ca.ftb_llc'],
    evidence: [
      sourceEvidence(
        'ca.ftb_568_booklet_2025',
        'Annual Limited Liability Company Tax',
        'The annual tax is due on or before the 15th day of the 4th month after the beginning of the taxable year.',
      ),
      sourceEvidence(
        'ca.ftb_llc',
        'Annual tax',
        'FTB LLC overview confirms the $800 annual tax via Form 3522 due 15th day of the 4th month after tax year begin.',
        { authorityRole: 'cross_check' },
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
    sourceIds: ['ca.ftb_business_due_dates', 'ca.ftb_568_booklet_2025', 'ca.ftb_llc'],
    evidence: [
      sourceEvidence(
        'ca.ftb_568_booklet_2025',
        'LLC fee',
        'FTB requires estimating and paying the LLC fee by the 15th day of the 6th month of the current taxable year.',
      ),
      sourceEvidence(
        'ca.ftb_llc',
        'LLC fee chart',
        'FTB LLC overview links to the LLC fee chart, which tiers the fee by California-source total income.',
        { authorityRole: 'cross_check' },
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
      kind: 'nth_day_after_tax_year_end',
      monthOffset: 3,
      day: 15,
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      formName: 'Form IT-370-PF',
      durationMonths: 6,
      paymentExtended: false,
      notes: 'Extension must be filed by the return due date.',
    },
    sourceIds: ['ny.partnerships', 'ny.tax_calendar.2026'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar.2026',
        'March 16 entries',
        'NY calendar lists partnership tax return due for calendar-year filers.',
      ),
      sourceEvidence(
        'ny.partnerships',
        'Partnership filing guidance',
        'NY partnership return due dates follow the partnership tax year close.',
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
    sourceIds: ['ny.tax_calendar.2026', 'ny.it204ll'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar.2026',
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
    ruleTier: 'annual_rolling',
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
      durationMonths: 6,
      paymentExtended: false,
      notes: 'Calendar-year return due date is from NY calendar and Article 9-A guidance.',
    },
    sourceIds: ['ny.tax_calendar.2026', 'ny.article_9a'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar.2026',
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
    id: 'ny.ct3s.return.2025',
    title: 'New York S corporation franchise tax return',
    jurisdiction: 'NY',
    entityApplicability: ['s_corp'],
    taxType: 'ny_ct3s',
    formName: 'Form CT-3-S',
    eventType: 'filing',
    isFiling: true,
    isPayment: false,
    taxYear: 2025,
    applicableYear: 2026,
    ruleTier: 'annual_rolling',
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
      notes: 'Calendar-year S corporation returns are listed on the NY filing calendar.',
    },
    sourceIds: ['ny.tax_calendar.2026', 'ny.article_9a'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar.2026',
        'March 16 entries',
        'NY calendar lists S corporation tax return due for calendar-year filers.',
      ),
      sourceEvidence(
        'ny.article_9a',
        'S corporation guidance',
        'NY Article 9-A resources distinguish S corporation return filing from C corporation filing.',
      ),
    ],
    defaultTip: 'Calendar-year NY S corporation returns for 2025 are due March 16, 2026.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ny.ptet.election.2026',
    title: 'New York PTET election',
    jurisdiction: 'NY',
    entityApplicability: ['partnership', 's_corp'],
    taxType: 'ny_ptet_election',
    formName: 'PTET election',
    eventType: 'election',
    isFiling: true,
    isPayment: false,
    taxYear: 2026,
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
      available: false,
      paymentExtended: false,
      notes: 'The annual PTET election must be made by an authorized person.',
    },
    sourceIds: ['ny.ptet', 'ny.tax_calendar.2026'],
    evidence: [
      sourceEvidence(
        'ny.ptet',
        'Annual election',
        'NY PTET election requires entity-level authorization and applicability review.',
      ),
      sourceEvidence(
        'ny.tax_calendar.2026',
        'March 16 entries',
        'NY calendar lists the PTET election deadline for the 2026 tax year.',
      ),
    ],
    defaultTip: 'Confirm the client wants to make a PTET election before treating this as work.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'ny.ptet.estimated_payments.2026',
    title: 'New York PTET estimated payments',
    jurisdiction: 'NY',
    entityApplicability: ['partnership', 's_corp'],
    taxType: 'ny_ptet_estimated_tax',
    formName: 'PTET estimated payments',
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
      kind: 'period_table',
      frequency: 'quarterly',
      periods: [
        { period: '2026-Q1', dueDate: '2026-03-16' },
        { period: '2026-Q2', dueDate: '2026-06-15' },
        { period: '2026-Q3', dueDate: '2026-09-15' },
        { period: '2026-Q4', dueDate: '2026-12-15' },
      ],
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'PTET estimated payments are payment-only and depend on election status.',
    },
    sourceIds: ['ny.ptet', 'ny.tax_calendar.2026'],
    evidence: [
      sourceEvidence(
        'ny.ptet',
        'Estimated payments',
        'NY PTET estimated payments apply only to electing entities.',
      ),
      sourceEvidence(
        'ny.tax_calendar.2026',
        'PTET estimated payments',
        'NY calendar lists 2026 PTET estimated payment dates.',
      ),
    ],
    defaultTip: 'Generate only after confirming the entity elected into PTET.',
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
    eventType: 'filing',
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
    sourceIds: ['ny.tax_calendar.2026', 'ny.ptet'],
    evidence: [
      sourceEvidence(
        'ny.tax_calendar.2026',
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
    taxType: 'tx_franchise_report',
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
    sourceIds: ['tx.franchise_home', 'tx.franchise_overview'],
    evidence: [
      sourceEvidence(
        'tx.franchise_overview',
        'Due Dates, Extensions and Filing Methods',
        'Texas lists franchise tax reports as due May 15 each year.',
      ),
      sourceEvidence(
        'tx.franchise_home',
        'Franchise Tax 2026 Reports',
        'Texas lists 2026 franchise tax reports as due May 15, 2026.',
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
    taxType: 'tx_pir_oir',
    formName: 'PIR/OIR',
    eventType: 'information_report',
    isFiling: true,
    isPayment: false,
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
      notes: 'Information report follows annual franchise tax report due date.',
    },
    sourceIds: ['tx.franchise_annual_report', 'tx.pir_oir'],
    evidence: [
      sourceEvidence(
        'tx.pir_oir',
        'Filing Requirements',
        'PIR is due on the annual franchise tax report due date.',
      ),
      sourceEvidence(
        'tx.franchise_annual_report',
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
    id: 'tx.franchise.extension.2026',
    title: 'Texas franchise tax extension request',
    jurisdiction: 'TX',
    entityApplicability: ['llc', 'partnership', 's_corp', 'c_corp'],
    taxType: 'tx_franchise_extension',
    formName: 'Texas franchise tax extension',
    eventType: 'extension',
    isFiling: true,
    isPayment: true,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'applicability_review',
    status: 'verified',
    coverageStatus: 'manual',
    riskLevel: 'high',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'fixed_date',
      date: '2026-05-15',
      holidayRollover: 'next_business_day',
    },
    extensionPolicy: {
      available: true,
      paymentExtended: false,
      notes:
        'Extension payment and request requirements depend on prior-year and current-year tax.',
    },
    sourceIds: ['tx.franchise_extensions', 'tx.franchise_overview'],
    evidence: [
      sourceEvidence(
        'tx.franchise_extensions',
        'Franchise tax extensions',
        'Texas extension request and payment requirements are due by the original report due date.',
      ),
      sourceEvidence(
        'tx.franchise_overview',
        'Due Dates, Extensions and Filing Methods',
        'Texas franchise tax reports are due May 15 each year.',
      ),
    ],
    defaultTip: 'Confirm extension payment requirements before treating the report as extended.',
    quality: VERIFIED_QUALITY,
    verifiedBy: 'ops.rules.manual',
    verifiedAt: VERIFIED_AT,
    nextReviewOn: NEXT_PRE_SEASON_REVIEW,
    version: 1,
  },
  {
    id: 'tx.franchise.no_tax_due_threshold.2026',
    title: 'Texas franchise no-tax-due threshold review',
    jurisdiction: 'TX',
    entityApplicability: ['llc', 'partnership', 's_corp', 'c_corp'],
    taxType: 'tx_no_tax_due_threshold',
    formName: 'No tax due review',
    eventType: 'information_report',
    isFiling: false,
    isPayment: false,
    taxYear: 2026,
    applicableYear: 2026,
    ruleTier: 'applicability_review',
    status: 'verified',
    coverageStatus: 'manual',
    riskLevel: 'med',
    requiresApplicabilityReview: true,
    dueDateLogic: {
      kind: 'source_defined_calendar',
      description: 'No-tax-due treatment depends on report year forms and revenue threshold.',
      holidayRollover: 'source_adjusted',
    },
    extensionPolicy: {
      available: false,
      paymentExtended: false,
      notes: 'This is a review flag, not a filing conclusion or payment deadline.',
    },
    sourceIds: ['tx.franchise_forms_2026', 'tx.franchise_overview'],
    evidence: [
      sourceEvidence(
        'tx.franchise_forms_2026',
        '2026 franchise forms',
        'Texas report-year forms define no-tax-due availability and reporting changes.',
      ),
      sourceEvidence(
        'tx.franchise_overview',
        'No Tax Due Reporting',
        'Texas no-tax-due rules require threshold review before conclusion.',
      ),
    ],
    defaultTip: 'Use this as a CPA review prompt, not as an automatic deadline.',
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
        { period: '2026-03', dueDate: '2026-04-27' },
        { period: '2026-04', dueDate: '2026-05-26' },
        { period: '2026-05', dueDate: '2026-06-25' },
        { period: '2026-06', dueDate: '2026-07-27' },
        { period: '2026-07', dueDate: '2026-08-25' },
        { period: '2026-08', dueDate: '2026-09-25' },
        { period: '2026-09', dueDate: '2026-10-26' },
        { period: '2026-10', dueDate: '2026-11-25' },
        { period: '2026-11', dueDate: '2026-12-28' },
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
        { period: '2026-Q3', dueDate: '2026-11-02' },
        { period: '2026-Q4', dueDate: '2027-02-01' },
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

export function normalizeRuleTaxTypeCandidates(taxType: string): readonly RuleTaxTypeCandidate[] {
  const candidates: RuleTaxTypeCandidate[] = [
    {
      inputTaxType: taxType,
      taxType,
      requiresReview: false,
      reviewReason: null,
    },
  ]

  for (const alias of RULE_TAX_TYPE_ALIASES[taxType] ?? []) {
    if (candidates.some((candidate) => candidate.taxType === alias.taxType)) continue

    candidates.push({
      inputTaxType: taxType,
      taxType: alias.taxType,
      requiresReview: alias.requiresReview ?? false,
      reviewReason: alias.reason ?? null,
    })
  }

  return candidates
}

function ruleMatchesJurisdiction(rule: ObligationRule, client: RuleGenerationClientFacts): boolean {
  return rule.jurisdiction === 'FED' || rule.jurisdiction === client.state
}

function ruleMatchesEntity(rule: ObligationRule, entityType: RuleGenerationEntity): boolean {
  if (entityType !== 'other' && rule.entityApplicability.includes(entityType)) return true
  if (!rule.entityApplicability.includes('any_business')) return false

  return entityType !== 'individual' && entityType !== 'trust'
}

function getTaxTypeMatches(client: RuleGenerationClientFacts): readonly RuleTaxTypeCandidate[] {
  const matches = new Map<string, RuleTaxTypeCandidate>()

  for (const taxType of client.taxTypes) {
    for (const candidate of normalizeRuleTaxTypeCandidates(taxType)) {
      const existing = matches.get(candidate.taxType)
      if (existing && !existing.requiresReview) continue
      matches.set(candidate.taxType, candidate)
    }
  }

  return [...matches.values()]
}

function reviewReasonsForRule(
  rule: ObligationRule,
  match: RuleTaxTypeCandidate,
  expandedRequiresReview: boolean,
  expandedReason: string | null,
): string[] {
  const reasons: string[] = []

  if (match.requiresReview && match.reviewReason) reasons.push(match.reviewReason)
  if (rule.requiresApplicabilityReview) reasons.push('rule_requires_applicability_review')
  if (rule.ruleTier === 'applicability_review') reasons.push('rule_tier_applicability_review')
  if (rule.coverageStatus !== 'full') reasons.push(`coverage_${rule.coverageStatus}`)
  if (expandedRequiresReview) reasons.push('due_date_requires_review')
  if (expandedReason) reasons.push(expandedReason)

  return Array.from(new Set(reasons))
}

export function previewObligationsFromRules(
  input: RuleGenerationInput,
): readonly ObligationGenerationPreview[] {
  const rules = input.rules ?? OBLIGATION_RULES
  const taxTypeMatches = getTaxTypeMatches(input.client)
  const previews: ObligationGenerationPreview[] = []

  for (const rule of rules) {
    if (rule.status !== 'verified') continue
    if (!ruleMatchesJurisdiction(rule, input.client)) continue
    if (!ruleMatchesEntity(rule, input.client.entityType)) continue

    const match = taxTypeMatches.find((candidate) => candidate.taxType === rule.taxType)
    if (!match) continue

    const expandInput: {
      taxYearStart?: string
      taxYearEnd?: string
      holidays?: readonly string[]
    } = {}
    if (input.client.taxYearStart !== undefined)
      expandInput.taxYearStart = input.client.taxYearStart
    if (input.client.taxYearEnd !== undefined) expandInput.taxYearEnd = input.client.taxYearEnd
    if (input.holidays !== undefined) expandInput.holidays = input.holidays

    const expandedDates = expandDueDateLogic(rule.dueDateLogic, expandInput)

    for (const expanded of expandedDates) {
      const reviewReasons = reviewReasonsForRule(
        rule,
        match,
        expanded.requiresReview,
        expanded.reason,
      )
      const requiresReview = reviewReasons.length > 0

      previews.push({
        clientId: input.client.id,
        ruleId: rule.id,
        ruleVersion: rule.version,
        ruleTitle: rule.title,
        jurisdiction: rule.jurisdiction,
        taxType: rule.taxType,
        matchedTaxType: match.inputTaxType,
        period: expanded.period,
        dueDate: expanded.dueDate,
        eventType: rule.eventType,
        isFiling: rule.isFiling,
        isPayment: rule.isPayment,
        formName: rule.formName,
        sourceIds: rule.sourceIds,
        evidence: rule.evidence,
        requiresReview,
        reminderReady: !requiresReview && expanded.dueDate !== null,
        reviewReasons,
      })
    }
  }

  return previews
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
