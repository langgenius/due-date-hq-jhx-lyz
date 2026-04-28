import type { NormalizationRow } from '@duedatehq/contracts'

const REQUIRED_NORMALIZATION_FIELDS = new Set(['entity_type', 'state'])

export function canContinueNormalization(rows: readonly NormalizationRow[]): boolean {
  return rows.every((row) => {
    if (!REQUIRED_NORMALIZATION_FIELDS.has(row.field)) return true
    return (row.normalizedValue ?? '').trim().length > 0
  })
}
