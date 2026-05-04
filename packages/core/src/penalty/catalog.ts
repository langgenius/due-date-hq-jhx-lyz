export interface PenaltySourceRef {
  label: string
  url: string
  sourceExcerpt: string
  effectiveDate: string
  lastReviewedDate: string
}

export type FormulaKind =
  | 'federal_partnership_owner_month'
  | 'federal_s_corp_shareholder_month'
  | 'federal_tax_due_return'
  | 'federal_corp_estimated_tax'
  | 'tax_due_monthly'
  | 'owner_month'
  | 'owner_month_plus_tax_due_monthly'
  | 'fixed_percent_unpaid_tax'
  | 'installment_underpayment'
  | 'tx_franchise_report'
  | 'tx_franchise_extension'
  | 'wa_excise_late_payment'
  | 'fl_cit_return'
  | 'fixed_late_report'
  | 'unsupported'

export type PenaltyFactKey =
  | 'taxDueCents'
  | 'paymentsAndCreditsCents'
  | 'installments'
  | 'memberCount'
  | 'partnerCount'
  | 'shareholderCount'
  | 'waSubtotalMinusCreditsCents'
  | 'txPriorYearFranchiseTaxCents'
  | 'txCurrentYearFranchiseTaxCents'

export interface TaxDueMonthlyConfig {
  lateFilingMonthlyRate?: number
  lateFilingCapRate?: number
  latePaymentInitialRate?: number
  latePaymentMonthlyRate?: number
  latePaymentMaxMonths?: number
  latePaymentCapRate?: number
  combinedCapRate?: number
  combinedMonthlyCapRate?: number
  minimumAfterDays?: {
    daysLate: number
    amountCents: number
  }
}

export interface OwnerMonthConfig {
  countFact: 'memberCount' | 'partnerCount' | 'shareholderCount'
  countLabel: string
  monthlyPenaltyCents: number
  maxMonths: number
}

export interface FormulaRuleCalculation {
  taxDueMonthly?: TaxDueMonthlyConfig
  ownerMonth?: OwnerMonthConfig
  fixedPercentRate?: number
  fixedReportPenaltyCents?: number
}

export interface FormulaRule {
  kind: FormulaKind
  label: string
  jurisdiction: string
  taxTypeAliases: readonly string[]
  requiredFacts: readonly PenaltyFactKey[]
  sourceRefs: readonly PenaltySourceRef[]
  calculation?: FormulaRuleCalculation
  supportsOptionalTaxDue?: boolean
  unsupportedReason?: string
}

export interface PenaltyFormulaCatalogEntry {
  taxType: string
  jurisdiction: string
  label: string
  requiredFacts: readonly PenaltyFactKey[]
  sourceRefs: readonly PenaltySourceRef[]
}

export const IRS_FAILURE_TO_FILE: PenaltySourceRef = {
  label: 'IRS failure to file penalty',
  url: 'https://www.irs.gov/payments/failure-to-file-penalty',
  sourceExcerpt:
    'IRS calculates failure-to-file from unpaid tax by month or partial month, subject to statutory caps and minimums.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

export const IRS_FAILURE_TO_PAY: PenaltySourceRef = {
  label: 'IRS failure to pay penalty',
  url: 'https://www.irs.gov/payments/failure-to-pay-penalty',
  sourceExcerpt:
    'IRS calculates failure-to-pay from unpaid tax by month or partial month and caps it at 25% of unpaid tax.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const IRS_FORM_1065: PenaltySourceRef = {
  label: 'IRS Instructions for Form 1065',
  url: 'https://www.irs.gov/instructions/i1065',
  sourceExcerpt:
    'Partnership late-return penalties are stated per partner for each month or part of a month the return is late.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const IRS_FORM_1120S: PenaltySourceRef = {
  label: 'IRS Instructions for Form 1120-S',
  url: 'https://www.irs.gov/instructions/i1120s',
  sourceExcerpt:
    'S corporation late-return penalties are stated per shareholder, with additional unpaid-tax penalties when tax is due.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const IRS_FORM_2220: PenaltySourceRef = {
  label: 'IRS Form 2220 / IRC 6655',
  url: 'https://www.irs.gov/forms-pubs/about-form-2220',
  sourceExcerpt:
    'Corporations use Form 2220 to determine whether they owe underpayment penalty and the amount for each period.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const IRS_CORP_ESTIMATED_TAX: PenaltySourceRef = {
  label: 'IRS underpayment of estimated tax by corporations penalty',
  url: 'https://www.irs.gov/payments/underpayment-of-estimated-tax-by-corporations-penalty',
  sourceExcerpt:
    'IRS calculation uses underpayment amount, underpaid period, and quarterly underpayment interest rates.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

export const FEDERAL_TAX_DUE_SOURCES = [IRS_FAILURE_TO_FILE, IRS_FAILURE_TO_PAY] as const

const CA_COMMON_PENALTIES: PenaltySourceRef = {
  label: 'California FTB common penalties and fees',
  url: 'https://www.ftb.ca.gov/pay/penalties-and-interest/index.html',
  sourceExcerpt:
    'FTB lists delinquent filing at 5% per month up to 25% and late payment at 5% plus 0.5% per month.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const CA_ENTITY_PENALTIES: PenaltySourceRef = {
  label: 'California FTB 5949 entity penalties',
  url: 'https://www.ftb.ca.gov/forms/misc/5949.html',
  sourceExcerpt:
    'FTB 5949 lists entity delinquent return, late payment, LLC estimated fee, LLC/member, partnership, and S corporation penalties.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const NY_CT3_INSTRUCTIONS: PenaltySourceRef = {
  label: 'New York Form CT-3 instructions',
  url: 'https://www.tax.ny.gov/forms/current-forms/ct/ct3i.htm',
  sourceExcerpt:
    'NY CT-3 instructions list late filing at 5% per month, late payment at 0.5% per month, caps, and the over-60-day minimum.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const NY_INTEREST_AND_PENALTIES: PenaltySourceRef = {
  label: 'New York interest and penalties',
  url: 'https://www.tax.ny.gov/pit/file/interest_and_penalties.htm',
  sourceExcerpt:
    'NY lists late filing at 5% per month up to 25%, late payment at 0.5% per month up to 25%, and estimated-tax underpayment rules.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const NY_PARTNERSHIP_EXTENSION_INSTRUCTIONS: PenaltySourceRef = {
  label: 'New York Form IT-370-PF instructions',
  url: 'https://www.tax.ny.gov/pdf/2023/printable-pdfs/inc/it370pfi-2023.pdf',
  sourceExcerpt:
    'NY partnership late filing penalty is $50 per applicable partner per month or part month, capped at 5 months.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const NY_PTET: PenaltySourceRef = {
  label: 'New York pass-through entity tax',
  url: 'https://www.tax.ny.gov/bus/ptet/',
  sourceExcerpt:
    'NY PTET estimated payments are quarterly and each payment should equal at least 25% of the required annual payment.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const TX_PAST_DUE_TAXES: PenaltySourceRef = {
  label: 'Texas Comptroller penalties for past due taxes',
  url: 'https://comptroller.texas.gov/taxes/file-pay/penalties.php',
  sourceExcerpt:
    'Texas lists 5% penalty for tax 1-30 days late, 10% over 30 days late, plus interest after day 60.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const TX_LATE_FILING: PenaltySourceRef = {
  label: 'Texas Comptroller late-filing penalty publication',
  url: 'https://comptroller.texas.gov/taxes/publications/98-918.pdf',
  sourceExcerpt:
    'Texas assesses a $50 penalty on each late report, including franchise tax, regardless of whether tax is due.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const TX_FRANCHISE_EXTENSION_RULE: PenaltySourceRef = {
  label: 'Texas Administrative Code franchise tax extensions',
  url: 'https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=34&pt=1&ch=3&rl=585',
  sourceExcerpt:
    'Texas extension rule keys penalty relief to timely payment of prior-year tax or 90% of current-year tax.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const FL_CORPORATE_LATE_RETURN: PenaltySourceRef = {
  label: 'Florida Statutes section 220.801',
  url: 'https://www.flsenate.gov/Laws/Statutes/2025/220.801',
  sourceExcerpt:
    'Florida corporate income tax late-return penalty is 10% per month up to 50%, or $50 per month up to $300 when no tax is due.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const FL_CORPORATE_INTEREST: PenaltySourceRef = {
  label: 'Florida Statutes section 220.807',
  url: 'https://www.flsenate.gov/Laws/Statutes/2025/220.807',
  sourceExcerpt:
    'Florida corporate income tax interest rate is set by statute and requires rate facts for underpayment calculations.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const WA_PENALTY_WAIVERS: PenaltySourceRef = {
  label: 'Washington DOR penalty waivers',
  url: 'https://dor.wa.gov/file-pay-taxes/late-filing/penalty-waivers',
  sourceExcerpt:
    'Washington DOR lists late penalties at 9%, then 19%, then 29%, with a $5 minimum late-payment penalty.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

const WA_COMBINED_EXCISE_TOTALS: PenaltySourceRef = {
  label: 'Washington Combined Excise Tax Return totals',
  url: 'https://dor.wa.gov/file-pay-taxes/file-or-amend-my-return/instructions-completing-combined-excise-tax-return/combined-excise-tax-return-totals',
  sourceExcerpt:
    'Washington instructs late filers to multiply the penalty rate by subtotal minus credits; no penalty applies if no tax is due.',
  effectiveDate: '2026-01-01',
  lastReviewedDate: '2026-05-04',
}

export const STATE_UNSUPPORTED_REASON =
  'No source-backed state penalty formula catalog entry has been verified for this tax type.'

export const FORMULA_RULES: Record<string, FormulaRule> = {
  federal_1065: {
    kind: 'federal_partnership_owner_month',
    label: 'Federal Form 1065 late partnership return penalty',
    jurisdiction: 'FED',
    taxTypeAliases: ['federal_1065'],
    requiredFacts: ['partnerCount'],
    sourceRefs: [IRS_FORM_1065],
  },
  federal_1120s: {
    kind: 'federal_s_corp_shareholder_month',
    label: 'Federal Form 1120-S late S corporation return penalty',
    jurisdiction: 'FED',
    taxTypeAliases: ['federal_1120s'],
    requiredFacts: ['shareholderCount'],
    supportsOptionalTaxDue: true,
    sourceRefs: [IRS_FORM_1120S, ...FEDERAL_TAX_DUE_SOURCES],
  },
  federal_1120: {
    kind: 'federal_tax_due_return',
    label: 'Federal Form 1120 late filing/payment penalty',
    jurisdiction: 'FED',
    taxTypeAliases: ['federal_1120'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: FEDERAL_TAX_DUE_SOURCES,
  },
  federal_1120_estimated_tax: {
    kind: 'federal_corp_estimated_tax',
    label: 'Federal corporation estimated tax underpayment penalty',
    jurisdiction: 'FED',
    taxTypeAliases: ['federal_1120_estimated_tax'],
    requiredFacts: ['installments'],
    sourceRefs: [IRS_FORM_2220, IRS_CORP_ESTIMATED_TAX],
  },
  ca_100: {
    kind: 'tax_due_monthly',
    label: 'California Form 100 delinquent return and late payment penalty',
    jurisdiction: 'CA',
    taxTypeAliases: ['ca_100'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [CA_COMMON_PENALTIES, CA_ENTITY_PENALTIES],
    calculation: {
      taxDueMonthly: {
        lateFilingMonthlyRate: 0.05,
        lateFilingCapRate: 0.25,
        latePaymentInitialRate: 0.05,
        latePaymentMonthlyRate: 0.005,
        latePaymentMaxMonths: 40,
        latePaymentCapRate: 0.25,
        combinedCapRate: 0.25,
      },
    },
  },
  ca_100s: {
    kind: 'owner_month_plus_tax_due_monthly',
    label: 'California Form 100S S corporation late return penalty',
    jurisdiction: 'CA',
    taxTypeAliases: ['ca_100s'],
    requiredFacts: ['shareholderCount'],
    sourceRefs: [CA_COMMON_PENALTIES, CA_ENTITY_PENALTIES],
    calculation: {
      ownerMonth: {
        countFact: 'shareholderCount',
        countLabel: 'shareholder',
        monthlyPenaltyCents: 1_800,
        maxMonths: 12,
      },
      taxDueMonthly: {
        lateFilingMonthlyRate: 0.05,
        lateFilingCapRate: 0.25,
        latePaymentInitialRate: 0.05,
        latePaymentMonthlyRate: 0.005,
        latePaymentMaxMonths: 40,
        latePaymentCapRate: 0.25,
        combinedCapRate: 0.25,
      },
    },
    supportsOptionalTaxDue: true,
  },
  ca_llc_568: {
    kind: 'owner_month_plus_tax_due_monthly',
    label: 'California Form 568 LLC late return and late payment penalty',
    jurisdiction: 'CA',
    taxTypeAliases: ['ca_llc_568'],
    requiredFacts: ['memberCount'],
    sourceRefs: [CA_COMMON_PENALTIES, CA_ENTITY_PENALTIES],
    calculation: {
      ownerMonth: {
        countFact: 'memberCount',
        countLabel: 'member',
        monthlyPenaltyCents: 1_800,
        maxMonths: 12,
      },
      taxDueMonthly: {
        latePaymentInitialRate: 0.05,
        latePaymentMonthlyRate: 0.005,
        latePaymentMaxMonths: 40,
        latePaymentCapRate: 0.25,
      },
    },
    supportsOptionalTaxDue: true,
  },
  ca_llc_estimated_fee: {
    kind: 'fixed_percent_unpaid_tax',
    label: 'California LLC estimated fee underpayment penalty',
    jurisdiction: 'CA',
    taxTypeAliases: ['ca_llc_estimated_fee'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [CA_ENTITY_PENALTIES],
    calculation: {
      fixedPercentRate: 0.1,
    },
  },
  ca_llc_annual_tax: {
    kind: 'tax_due_monthly',
    label: 'California LLC annual tax late payment penalty',
    jurisdiction: 'CA',
    taxTypeAliases: ['ca_llc_annual_tax'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [CA_COMMON_PENALTIES, CA_ENTITY_PENALTIES],
    calculation: {
      taxDueMonthly: {
        latePaymentInitialRate: 0.05,
        latePaymentMonthlyRate: 0.005,
        latePaymentMaxMonths: 40,
        latePaymentCapRate: 0.25,
      },
    },
  },
  ny_ct3: {
    kind: 'tax_due_monthly',
    label: 'New York CT-3 late filing and late payment additional charges',
    jurisdiction: 'NY',
    taxTypeAliases: ['ny_ct3'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [NY_CT3_INSTRUCTIONS],
    calculation: {
      taxDueMonthly: {
        lateFilingMonthlyRate: 0.05,
        lateFilingCapRate: 0.25,
        latePaymentMonthlyRate: 0.005,
        latePaymentCapRate: 0.25,
        combinedMonthlyCapRate: 0.05,
        minimumAfterDays: { daysLate: 60, amountCents: 10_000 },
      },
    },
  },
  ny_ct3s: {
    kind: 'tax_due_monthly',
    label: 'New York CT-3-S late filing and late payment additional charges',
    jurisdiction: 'NY',
    taxTypeAliases: ['ny_ct3s'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [NY_CT3_INSTRUCTIONS],
    calculation: {
      taxDueMonthly: {
        lateFilingMonthlyRate: 0.05,
        lateFilingCapRate: 0.25,
        latePaymentMonthlyRate: 0.005,
        latePaymentCapRate: 0.25,
        combinedMonthlyCapRate: 0.05,
        minimumAfterDays: { daysLate: 60, amountCents: 10_000 },
      },
    },
  },
  ny_it204: {
    kind: 'owner_month',
    label: 'New York partnership late filing penalty',
    jurisdiction: 'NY',
    taxTypeAliases: ['ny_it204'],
    requiredFacts: ['partnerCount'],
    sourceRefs: [NY_PARTNERSHIP_EXTENSION_INSTRUCTIONS],
    calculation: {
      ownerMonth: {
        countFact: 'partnerCount',
        countLabel: 'partner',
        monthlyPenaltyCents: 5_000,
        maxMonths: 5,
      },
    },
  },
  ny_it204ll: {
    kind: 'tax_due_monthly',
    label: 'New York IT-204-LL annual filing fee late payment penalty',
    jurisdiction: 'NY',
    taxTypeAliases: ['ny_it204ll'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [NY_INTEREST_AND_PENALTIES],
    calculation: {
      taxDueMonthly: {
        lateFilingMonthlyRate: 0.05,
        lateFilingCapRate: 0.25,
        latePaymentMonthlyRate: 0.005,
        latePaymentCapRate: 0.25,
        combinedMonthlyCapRate: 0.05,
        minimumAfterDays: { daysLate: 60, amountCents: 10_000 },
      },
    },
  },
  ny_ptet_estimated_tax: {
    kind: 'installment_underpayment',
    label: 'New York PTET estimated tax underpayment penalty',
    jurisdiction: 'NY',
    taxTypeAliases: ['ny_ptet_estimated_tax'],
    requiredFacts: ['installments'],
    sourceRefs: [NY_PTET, NY_INTEREST_AND_PENALTIES],
  },
  ny_ptet: {
    kind: 'tax_due_monthly',
    label: 'New York PTET annual return late filing and late payment penalty',
    jurisdiction: 'NY',
    taxTypeAliases: ['ny_ptet'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [NY_PTET, NY_INTEREST_AND_PENALTIES],
    calculation: {
      taxDueMonthly: {
        lateFilingMonthlyRate: 0.05,
        lateFilingCapRate: 0.25,
        latePaymentMonthlyRate: 0.005,
        latePaymentCapRate: 0.25,
        combinedMonthlyCapRate: 0.05,
        minimumAfterDays: { daysLate: 60, amountCents: 10_000 },
      },
    },
  },
  fl_f1120: {
    kind: 'fl_cit_return',
    label: 'Florida F-1120 corporate income tax late return penalty',
    jurisdiction: 'FL',
    taxTypeAliases: ['fl_f1120'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [FL_CORPORATE_LATE_RETURN],
  },
  fl_cit_estimated_tax: {
    kind: 'installment_underpayment',
    label: 'Florida corporate estimated income tax underpayment penalty',
    jurisdiction: 'FL',
    taxTypeAliases: ['fl_cit_estimated_tax'],
    requiredFacts: ['installments'],
    sourceRefs: [FL_CORPORATE_INTEREST],
  },
  tx_franchise_report: {
    kind: 'tx_franchise_report',
    label: 'Texas franchise tax report late filing and late payment penalty',
    jurisdiction: 'TX',
    taxTypeAliases: ['tx_franchise_report'],
    requiredFacts: ['taxDueCents', 'paymentsAndCreditsCents'],
    sourceRefs: [TX_PAST_DUE_TAXES, TX_LATE_FILING],
  },
  tx_franchise_extension: {
    kind: 'tx_franchise_extension',
    label: 'Texas franchise tax extension underpayment penalty',
    jurisdiction: 'TX',
    taxTypeAliases: ['tx_franchise_extension'],
    requiredFacts: [
      'txPriorYearFranchiseTaxCents',
      'txCurrentYearFranchiseTaxCents',
      'paymentsAndCreditsCents',
    ],
    sourceRefs: [TX_FRANCHISE_EXTENSION_RULE, TX_PAST_DUE_TAXES],
  },
  tx_pir_oir: {
    kind: 'fixed_late_report',
    label: 'Texas PIR/OIR late information report penalty',
    jurisdiction: 'TX',
    taxTypeAliases: ['tx_pir_oir'],
    requiredFacts: [],
    sourceRefs: [TX_LATE_FILING],
    calculation: {
      fixedReportPenaltyCents: 5_000,
    },
  },
  wa_combined_excise_monthly: {
    kind: 'wa_excise_late_payment',
    label: 'Washington monthly combined excise tax late payment penalty',
    jurisdiction: 'WA',
    taxTypeAliases: ['wa_combined_excise_monthly'],
    requiredFacts: ['waSubtotalMinusCreditsCents'],
    sourceRefs: [WA_PENALTY_WAIVERS, WA_COMBINED_EXCISE_TOTALS],
  },
  wa_combined_excise_quarterly: {
    kind: 'wa_excise_late_payment',
    label: 'Washington quarterly combined excise tax late payment penalty',
    jurisdiction: 'WA',
    taxTypeAliases: ['wa_combined_excise_quarterly'],
    requiredFacts: ['waSubtotalMinusCreditsCents'],
    sourceRefs: [WA_PENALTY_WAIVERS, WA_COMBINED_EXCISE_TOTALS],
  },
  wa_combined_excise_annual: {
    kind: 'wa_excise_late_payment',
    label: 'Washington annual combined excise tax late payment penalty',
    jurisdiction: 'WA',
    taxTypeAliases: ['wa_combined_excise_annual'],
    requiredFacts: ['waSubtotalMinusCreditsCents'],
    sourceRefs: [WA_PENALTY_WAIVERS, WA_COMBINED_EXCISE_TOTALS],
  },
}

export const KNOWN_STATE_TAX_TYPES = new Set([
  'ca_100',
  'ca_100s',
  'ca_llc_568',
  'ca_llc_estimated_fee',
  'ca_llc_annual_tax',
  'ny_ct3',
  'ny_ct3s',
  'ny_it204',
  'ny_it204ll',
  'ny_ptet_election',
  'ny_ptet_estimated_tax',
  'ny_ptet',
  'fl_f1120',
  'fl_cit_estimated_tax',
  'tx_franchise_report',
  'tx_franchise_extension',
  'tx_pir_oir',
  'tx_no_tax_due_threshold',
  'wa_combined_excise_annual',
  'wa_combined_excise_quarterly',
  'wa_combined_excise_monthly',
])

export const GENERIC_STATE_TAX_TYPE_RE =
  /^[a-z]{2}_state_(individual_income_tax|individual_estimated_tax|fiduciary_income_tax|business_income_franchise_tax|pte_composite_ptet|sales_use_tax|withholding_tax|ui_wage_report)$/

export function listPenaltyFormulaCatalog(): readonly PenaltyFormulaCatalogEntry[] {
  return Object.entries(FORMULA_RULES)
    .filter(([, rule]) => rule.kind !== 'unsupported')
    .map(([taxType, rule]) => ({
      taxType,
      jurisdiction: rule.jurisdiction,
      label: rule.label,
      requiredFacts: rule.requiredFacts,
      sourceRefs: rule.sourceRefs,
    }))
}
