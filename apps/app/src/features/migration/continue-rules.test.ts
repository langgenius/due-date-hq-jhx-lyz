import { describe, expect, it } from 'vitest'
import type { NormalizationRow } from '@duedatehq/contracts'
import { canContinueNormalization } from './continue-rules'

function row(field: string, normalizedValue: string | null): NormalizationRow {
  return {
    id: crypto.randomUUID(),
    batchId: 'batch-1',
    field,
    rawValue: 'raw',
    normalizedValue,
    confidence: null,
    model: null,
    promptVersion: 'test',
    reasoning: null,
    userOverridden: false,
    createdAt: new Date().toISOString(),
  }
}

describe('canContinueNormalization', () => {
  it('allows unresolved tax_types rows because Default Matrix can take over', () => {
    expect(
      canContinueNormalization([
        row('entity_type', 'llc'),
        row('state', 'CA'),
        row('tax_types', null),
      ]),
    ).toBe(true)
  })

  it('blocks unresolved visible entity and state rows', () => {
    expect(canContinueNormalization([row('entity_type', null), row('state', 'CA')])).toBe(false)
    expect(canContinueNormalization([row('entity_type', 'llc'), row('state', '')])).toBe(false)
  })
})
