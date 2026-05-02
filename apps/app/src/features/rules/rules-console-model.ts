import * as z from 'zod'
import { parseAsStringLiteral, type inferParserType } from 'nuqs'

import {
  RuleGenerationPreviewInputSchema,
  type DueDateLogic,
  type ObligationGenerationPreview,
  type ObligationRule,
  type RuleEvidenceAuthorityRole,
  type RuleGenerationPreviewInput,
  type RuleGenerationState,
  type RuleJurisdiction,
  type RuleSource,
} from '@duedatehq/contracts'

export const RULES_TAB_VALUES = ['coverage', 'sources', 'library', 'preview'] as const
export const DEFAULT_RULES_TAB = 'coverage'
export const rulesConsoleSearchParamsParsers = {
  tab: parseAsStringLiteral(RULES_TAB_VALUES)
    .withDefault(DEFAULT_RULES_TAB)
    .withOptions({ history: 'replace' }),
} as const
export type RulesConsoleSearchParams = inferParserType<typeof rulesConsoleSearchParamsParsers>
export type RulesTab = RulesConsoleSearchParams['tab']
export type SourceHealthFilter = 'all' | RuleSource['healthStatus']
export type RuleLibraryFilter =
  | 'all'
  | 'verified'
  | 'candidate'
  | 'applicability_review'
  | 'exception'
export type CoverageCellState = 'verified' | 'review' | 'none'

// Pure value tables only — i18n labels live with the consuming component
// (rendered through `useLingui` so Lingui can extract them and so we never
// pay re-extraction cost for non-React modules).
export const RULES_TABS: ReadonlyArray<{ value: RulesTab; count?: number }> = [
  { value: 'coverage' },
  { value: 'sources', count: 31 },
  { value: 'library', count: 26 },
  { value: 'preview' },
]

export const RULE_JURISDICTIONS: RuleJurisdiction[] = ['FED', 'CA', 'NY', 'TX', 'FL', 'WA']
export const RULE_GENERATION_STATES: RuleGenerationState[] = ['CA', 'NY', 'TX', 'FL', 'WA']
export const ENTITY_COLUMNS = ['llc', 'partnership', 's_corp', 'c_corp'] as const

export const COVERAGE_MATRIX: Record<
  RuleJurisdiction,
  Record<(typeof ENTITY_COLUMNS)[number], CoverageCellState>
> = {
  FED: { llc: 'review', partnership: 'review', s_corp: 'verified', c_corp: 'verified' },
  CA: { llc: 'review', partnership: 'none', s_corp: 'verified', c_corp: 'verified' },
  NY: { llc: 'review', partnership: 'review', s_corp: 'review', c_corp: 'verified' },
  TX: { llc: 'review', partnership: 'review', s_corp: 'review', c_corp: 'review' },
  FL: { llc: 'none', partnership: 'none', s_corp: 'none', c_corp: 'review' },
  WA: { llc: 'review', partnership: 'review', s_corp: 'review', c_corp: 'review' },
}

export const DEFAULT_PREVIEW_INPUT: RuleGenerationPreviewInput = {
  client: {
    id: 'cli_demo_acme_llc',
    entityType: 'llc',
    state: 'CA',
    taxTypes: ['federal_1065_or_1040', 'ca_llc_franchise_min_800', 'ca_llc_fee_gross_receipts'],
    taxYearStart: '2026-01-01',
    taxYearEnd: '2025-12-31',
  },
}

export const previewFormSchema = z.object({
  clientId: z.string().min(1),
  entityType: z.enum(['llc', 'partnership', 's_corp', 'c_corp']),
  state: z.enum(['CA', 'NY', 'TX', 'FL', 'WA']),
  taxYearStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxYearEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxTypes: z.string().min(1),
})

export type PreviewFormValues = z.infer<typeof previewFormSchema>

export type PreviewClientOption = Pick<
  PreviewFormValues,
  'clientId' | 'entityType' | 'state' | 'taxTypes'
>

export const PREVIEW_CLIENT_OPTIONS = [
  {
    clientId: DEFAULT_PREVIEW_INPUT.client.id,
    entityType: 'llc',
    state: 'CA',
    taxTypes: DEFAULT_PREVIEW_INPUT.client.taxTypes.join(', '),
  },
  {
    clientId: 'cli_demo_hudson_scorp',
    entityType: 's_corp',
    state: 'NY',
    taxTypes: ['federal_1120s', 'ny_ct3s', 'ny_ptet_optional'].join(', '),
  },
  {
    clientId: 'cli_demo_suncoast_c_corp',
    entityType: 'c_corp',
    state: 'FL',
    taxTypes: ['fl_f1120', 'fl_cit_estimated_tax'].join(', '),
  },
] as const satisfies readonly PreviewClientOption[]

export const DEFAULT_PREVIEW_FORM_VALUES: PreviewFormValues = {
  clientId: PREVIEW_CLIENT_OPTIONS[0].clientId,
  entityType: PREVIEW_CLIENT_OPTIONS[0].entityType,
  state: PREVIEW_CLIENT_OPTIONS[0].state,
  taxYearStart: DEFAULT_PREVIEW_INPUT.client.taxYearStart ?? '2026-01-01',
  taxYearEnd: DEFAULT_PREVIEW_INPUT.client.taxYearEnd ?? '2025-12-31',
  taxTypes: PREVIEW_CLIENT_OPTIONS[0].taxTypes,
}

export function previewCalendarYearToFormDates(
  year: number,
): Pick<PreviewFormValues, 'taxYearStart' | 'taxYearEnd'> {
  return {
    taxYearStart: `${year}-01-01`,
    taxYearEnd: `${year - 1}-12-31`,
  }
}

export function previewCalendarYearFromFormDates(
  values: Pick<PreviewFormValues, 'taxYearStart' | 'taxYearEnd'>,
): number {
  const startYear = parseIsoYear(values.taxYearStart)
  if (startYear !== null) return startYear

  const endYear = parseIsoYear(values.taxYearEnd)
  if (endYear !== null) return endYear + 1

  return parseIsoYear(DEFAULT_PREVIEW_FORM_VALUES.taxYearStart) ?? 2026
}

export function isRulesTab(value: string): value is RulesTab {
  return (RULES_TAB_VALUES as readonly string[]).includes(value)
}

export function previewFormToInput(values: PreviewFormValues): RuleGenerationPreviewInput {
  const input = {
    client: {
      id: values.clientId.trim(),
      entityType: values.entityType,
      state: values.state,
      taxYearStart: values.taxYearStart,
      taxYearEnd: values.taxYearEnd,
      taxTypes: values.taxTypes
        .split(/[,\s]+/)
        .map((taxType) => taxType.trim())
        .filter(Boolean),
    },
  }
  return RuleGenerationPreviewInputSchema.parse(input)
}

export function formatEnumLabel(value: string): string {
  return value.replaceAll('_', ' ')
}

function parseIsoYear(value: string): number | null {
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(value)
  if (!match) return null
  return Number(match[1])
}

export function compactAcquisitionMethod(method: RuleSource['acquisitionMethod']): string {
  return method.replace(/_(watch|review|subscription)$/, '')
}

export function compactSourceType(sourceType: RuleSource['sourceType']): string {
  if (sourceType === 'publication') return 'pub'
  if (sourceType === 'emergency_relief') return 'emergency'
  if (sourceType === 'early_warning') return 'early-warn'
  return sourceType
}

type SourceHealthOnly = Pick<RuleSource, 'healthStatus'>
type RuleFilterOnly = Pick<ObligationRule, 'ruleTier' | 'status'>
type PreviewReadyOnly = Pick<ObligationGenerationPreview, 'reminderReady'>

export function countSourcesByHealth(sources: readonly SourceHealthOnly[]) {
  return {
    all: sources.length,
    healthy: sources.filter((source) => source.healthStatus === 'healthy').length,
    degraded: sources.filter((source) => source.healthStatus === 'degraded').length,
    failing: sources.filter((source) => source.healthStatus === 'failing').length,
    paused: sources.filter((source) => source.healthStatus === 'paused').length,
  }
}

export function filterSources<T extends SourceHealthOnly>(
  sources: readonly T[],
  healthFilter: SourceHealthFilter,
): T[] {
  if (healthFilter === 'all') return [...sources]
  return sources.filter((source) => source.healthStatus === healthFilter)
}

export function countRulesByFilter(rules: readonly RuleFilterOnly[]) {
  return {
    all: rules.length,
    verified: rules.filter((rule) => rule.status === 'verified').length,
    candidate: rules.filter((rule) => rule.status === 'candidate').length,
    applicability_review: rules.filter((rule) => rule.ruleTier === 'applicability_review').length,
    exception: rules.filter((rule) => rule.ruleTier === 'exception').length,
  }
}

export function filterRules<T extends RuleFilterOnly>(
  rules: readonly T[],
  filter: RuleLibraryFilter,
): T[] {
  if (filter === 'all') return [...rules]
  if (filter === 'verified' || filter === 'candidate') {
    return rules.filter((rule) => rule.status === filter)
  }
  return rules.filter((rule) => rule.ruleTier === filter)
}

export function groupPreviewRows<T extends PreviewReadyOnly>(rows: readonly T[]) {
  return {
    reminderReady: rows.filter((row) => row.reminderReady),
    requiresReview: rows.filter((row) => !row.reminderReady),
  }
}

const ORDINAL_SUFFIX_BY_TENS = ['th', 'st', 'nd', 'rd'] as const

function ordinal(n: number): string {
  const lastTwo = n % 100
  const lastOne = n % 10
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
  return `${n}${ORDINAL_SUFFIX_BY_TENS[lastOne] ?? 'th'}`
}

function rolloverLabel(rollover: 'source_adjusted' | 'next_business_day'): string {
  return rollover === 'next_business_day' ? 'next business day' : 'source-adjusted'
}

/**
 * Renders a `DueDateLogic` discriminated union into a single human-readable
 * sentence for the Rule Detail drawer.
 *
 * Kept English-only on purpose: rule IDs, tax type slugs, and form names in
 * the surrounding UI are also un-localized internal terminology, and the
 * union shape is fixed by the contract (no localization fan-out risk).
 */
export function humanizeDueDateLogic(logic: DueDateLogic): string {
  if (logic.kind === 'fixed_date') {
    return `Fixed: ${logic.date} · ${rolloverLabel(logic.holidayRollover)} rollover`
  }
  if (logic.kind === 'nth_day_after_tax_year_end') {
    return `${ordinal(logic.day)} day of the ${ordinal(logic.monthOffset)} month after tax year end · ${rolloverLabel(logic.holidayRollover)} rollover`
  }
  if (logic.kind === 'nth_day_after_tax_year_begin') {
    return `${ordinal(logic.day)} day of the ${ordinal(logic.monthOffset)} month after tax year begin · ${rolloverLabel(logic.holidayRollover)} rollover`
  }
  if (logic.kind === 'period_table') {
    return `${logic.frequency} schedule · ${logic.periods.length} periods · ${rolloverLabel(logic.holidayRollover)} rollover`
  }
  return logic.description
}

export const RULE_AUTHORITY_ROLE_LABEL: Record<RuleEvidenceAuthorityRole, string> = {
  basis: 'Basis',
  cross_check: 'Cross-check',
  watch: 'Watch',
  early_warning: 'Early warn',
}
