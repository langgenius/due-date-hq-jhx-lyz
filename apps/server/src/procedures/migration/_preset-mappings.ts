import type { MappingRow, MappingTarget } from '@duedatehq/contracts'

/**
 * Preset-Profile fallback mappings — used when the AI Mapper is not used or
 * unavailable and the user picked a Preset Profile in Step 1.
 *
 * Authority:
 *   - docs/product-design/migration-copilot/04-ai-prompts.md §2.1 (preset boost)
 *   - docs/product-design/migration-copilot/02-ux-4step-wizard.md §5.4 (fallback banner)
 *   - docs/product-design/migration-copilot/06-fixtures/* (canonical column names)
 *
 * Confidence is fixed at 0.85 for fallback rows so the UI tags them Medium —
 * not High. Prompt version is `preset@v1` so audit / evidence drawer can
 * distinguish fallback rows from genuine AI rows at a glance.
 */

export const PRESET_VERSION = 'preset@v1'
export const PRESET_FALLBACK_CONFIDENCE = 0.85

export type PresetId = 'taxdome' | 'drake' | 'karbon' | 'quickbooks' | 'file_in_time'

const PRESET_MAPPINGS: Record<PresetId, Record<string, MappingTarget>> = {
  taxdome: {
    'Client Name': 'client.name',
    Name: 'client.name',
    EIN: 'client.ein',
    'Tax ID': 'client.ein',
    State: 'client.state',
    'State / Jurisdiction': 'client.state',
    County: 'client.county',
    'Entity Type': 'client.entity_type',
    Entity: 'client.entity_type',
    'Tax Types': 'client.tax_types',
    'Tax Return Type': 'client.tax_types',
    Email: 'client.email',
    Assignee: 'client.assignee_name',
    'Estimated Tax Due': 'client.estimated_tax_liability',
    'Estimated Tax Liability': 'client.estimated_tax_liability',
    'Penalty Tax Due': 'penalty.tax_due',
    Payments: 'penalty.payments_and_credits',
    'Payments and Credits': 'penalty.payments_and_credits',
    Frequency: 'penalty.filing_frequency',
    'Filing Frequency': 'penalty.filing_frequency',
    'Period Start': 'penalty.period_start',
    'Period End': 'penalty.period_end',
    Installments: 'penalty.installments',
    'Owner Count': 'client.equity_owner_count',
    Owners: 'client.equity_owner_count',
    Members: 'penalty.member_count',
    Partners: 'penalty.partner_count',
    Shareholders: 'penalty.shareholder_count',
    'Gross Receipts': 'penalty.gross_receipts',
    'Receipts Band': 'penalty.receipts_band',
    'No Tax Due': 'penalty.annual_report_no_tax_due',
    'WA Subtotal Minus Credits': 'penalty.wa_subtotal_minus_credits',
    'TX Prior Year Franchise Tax': 'penalty.tx_prior_year_franchise_tax',
    'TX Current Year Franchise Tax': 'penalty.tx_current_year_franchise_tax',
    'FL Tentative Tax': 'penalty.fl_tentative_tax',
    'NY PTET Election': 'penalty.ny_ptet_election_made',
    'NY PTET Payments': 'penalty.ny_ptet_payments',
    'Withholding Report Count': 'penalty.withholding_report_count',
    'UI Wage Report Count': 'penalty.ui_wage_report_count',
    Notes: 'client.notes',
    Status: 'IGNORE',
    SSN: 'IGNORE',
  },
  drake: {
    Name: 'client.name',
    'Taxpayer Name': 'client.name',
    'Last Name': 'client.name',
    EIN: 'client.ein',
    State: 'client.state',
    Resident: 'client.state',
    Entity: 'client.entity_type',
    'Entity Type': 'client.entity_type',
    'Return Type': 'client.tax_types',
    Email: 'client.email',
    Staff: 'client.assignee_name',
    Preparer: 'client.assignee_name',
    'Estimated Tax Due': 'client.estimated_tax_liability',
    'Penalty Tax Due': 'penalty.tax_due',
    Payments: 'penalty.payments_and_credits',
    'Owner Count': 'client.equity_owner_count',
    'Gross Receipts': 'penalty.gross_receipts',
    'WA Subtotal Minus Credits': 'penalty.wa_subtotal_minus_credits',
    Memo: 'client.notes',
    SSN: 'IGNORE',
  },
  karbon: {
    'Organization Name': 'client.name',
    'Customer Name': 'client.name',
    Name: 'client.name',
    'Tax ID': 'client.ein',
    'Tax Number': 'client.ein',
    State: 'client.state',
    Type: 'client.entity_type',
    'Primary Contact': 'client.assignee_name',
    Owner: 'client.assignee_name',
    'Contact Email': 'client.email',
    Email: 'client.email',
    'Estimated Tax Due': 'client.estimated_tax_liability',
    'Penalty Tax Due': 'penalty.tax_due',
    Payments: 'penalty.payments_and_credits',
    'Owner Count': 'client.equity_owner_count',
    'Gross Receipts': 'penalty.gross_receipts',
    Description: 'client.notes',
  },
  quickbooks: {
    'Display Name': 'client.name',
    Customer: 'client.name',
    'Tax ID': 'client.ein',
    'Billing State': 'client.state',
    State: 'client.state',
    'Customer Type': 'client.entity_type',
    Email: 'client.email',
    'Estimated Tax Due': 'client.estimated_tax_liability',
    'Penalty Tax Due': 'penalty.tax_due',
    Payments: 'penalty.payments_and_credits',
    'Owner Count': 'client.equity_owner_count',
    'Gross Receipts': 'penalty.gross_receipts',
    Notes: 'client.notes',
  },
  file_in_time: {
    Client: 'client.name',
    'Client Name': 'client.name',
    EIN: 'client.ein',
    State: 'client.state',
    Entity: 'client.entity_type',
    'Entity Type': 'client.entity_type',
    Service: 'client.tax_types',
    Returns: 'client.tax_types',
    Staff: 'client.assignee_name',
    Assignee: 'client.assignee_name',
    Email: 'client.email',
    County: 'client.county',
    'Estimated Tax Due': 'client.estimated_tax_liability',
    'Penalty Tax Due': 'penalty.tax_due',
    Payments: 'penalty.payments_and_credits',
    'Owner Count': 'client.equity_owner_count',
    'Gross Receipts': 'penalty.gross_receipts',
    'No Tax Due': 'penalty.annual_report_no_tax_due',
    Notes: 'client.notes',
  },
}

/**
 * Build mapping rows for a given preset against the actual headers we saw.
 * Headers without a known mapping fall to IGNORE so the user has to confirm
 * before Continue is enabled (UX §5.4).
 */
export function buildPresetMappings(
  preset: PresetId,
  headers: readonly string[],
  batchId: string,
): MappingRow[] {
  const dict = PRESET_MAPPINGS[preset]
  const now = new Date().toISOString()

  return headers.map((header) => {
    const trimmed = header.trim()
    const target = dict[trimmed] ?? dict[trimmed.toLowerCase()] ?? ('IGNORE' as MappingTarget)
    const isHit = target !== 'IGNORE'
    return {
      id: crypto.randomUUID(),
      batchId,
      sourceHeader: header,
      targetField: target,
      confidence: isHit ? PRESET_FALLBACK_CONFIDENCE : null,
      reasoning: isHit ? `${preset} preset default mapping` : 'No preset rule matched',
      userOverridden: false,
      model: null,
      promptVersion: PRESET_VERSION,
      createdAt: now,
    }
  })
}

/**
 * "All IGNORE" fallback when AI is unavailable AND no preset is picked.
 * Forces the user to override at least one column manually before Continue.
 */
export function buildAllIgnoreMappings(headers: readonly string[], batchId: string): MappingRow[] {
  const now = new Date().toISOString()
  return headers.map((header) => ({
    id: crypto.randomUUID(),
    batchId,
    sourceHeader: header,
    targetField: 'IGNORE' as MappingTarget,
    confidence: null,
    reasoning: 'No AI mapping available and no preset selected — please map manually.',
    userOverridden: false,
    model: null,
    promptVersion: PRESET_VERSION,
    createdAt: now,
  }))
}

export function isPresetId(value: string | null | undefined): value is PresetId {
  return (
    value === 'taxdome' ||
    value === 'drake' ||
    value === 'karbon' ||
    value === 'quickbooks' ||
    value === 'file_in_time'
  )
}
