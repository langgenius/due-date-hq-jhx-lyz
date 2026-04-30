import { describe, expect, it } from 'vitest'
import { estimatePenaltyExposure, summarizePenaltyExposure } from './index'

describe('@duedatehq/core/penalty', () => {
  it('calculates federal owner-month exposure over the default 90-day horizon', () => {
    const result = estimatePenaltyExposure({
      taxType: 'federal_1065',
      entityType: 'partnership',
      dueDate: '2026-03-16',
      equityOwnerCount: 3,
    })

    expect(result.status).toBe('ready')
    expect(result.estimatedExposureCents).toBe(229_500)
    expect(result.breakdown[0]?.formula).toContain('$255 x 3 owner')
  })

  it('returns needs_input instead of a fake zero amount when tax due is missing', () => {
    const result = estimatePenaltyExposure({
      taxType: 'federal_1120',
      entityType: 'c_corp',
      dueDate: '2026-04-15',
    })

    expect(result.status).toBe('needs_input')
    expect(result.estimatedExposureCents).toBeNull()
    expect(result.missingInputs).toEqual(['estimatedTaxLiabilityCents'])
  })

  it('calculates tax-due return exposure with caps and the 60-day minimum', () => {
    const result = estimatePenaltyExposure({
      taxType: 'federal_1120',
      entityType: 'c_corp',
      dueDate: '2026-04-15',
      estimatedTaxLiabilityCents: 10_000_00,
      horizonDays: 90,
    })

    expect(result.status).toBe('ready')
    expect(result.estimatedExposureCents).toBe(165_000)
    expect(result.breakdown.map((item) => item.key)).toEqual(['failure-to-file', 'failure-to-pay'])
  })

  it('guards zero and negative inputs as missing facts', () => {
    expect(
      estimatePenaltyExposure({
        taxType: 'federal_1065',
        dueDate: '2026-03-16',
        equityOwnerCount: 0,
      }).status,
    ).toBe('needs_input')
    expect(
      estimatePenaltyExposure({
        taxType: 'federal_1120',
        dueDate: '2026-04-15',
        estimatedTaxLiabilityCents: -1,
      }).status,
    ).toBe('needs_input')
  })

  it('returns unsupported for tax types without verified formula coverage', () => {
    const result = estimatePenaltyExposure({
      taxType: 'federal_disaster_relief',
      dueDate: '2026-04-15',
    })

    expect(result.status).toBe('unsupported')
    expect(result.estimatedExposureCents).toBeNull()
  })

  it('summarizes ready, needs-input, unsupported, and top exposure rows', () => {
    const summary = summarizePenaltyExposure([
      {
        id: 'oi-1',
        clientId: 'client-1',
        clientName: 'Acme LLC',
        taxType: 'federal_1065',
        currentDueDate: '2026-03-16',
        exposureStatus: 'ready',
        estimatedExposureCents: 229_500,
      },
      {
        id: 'oi-2',
        clientId: 'client-2',
        clientName: 'Beta Inc',
        taxType: 'federal_1120',
        currentDueDate: '2026-04-15',
        exposureStatus: 'needs_input',
        estimatedExposureCents: null,
      },
      {
        id: 'oi-3',
        clientId: 'client-3',
        clientName: 'Gamma Inc',
        taxType: 'federal_disaster_relief',
        currentDueDate: '2026-04-15',
        exposureStatus: 'unsupported',
        estimatedExposureCents: null,
      },
    ])

    expect(summary.totalExposureCents).toBe(229_500)
    expect(summary.readyCount).toBe(1)
    expect(summary.needsInputCount).toBe(1)
    expect(summary.unsupportedCount).toBe(1)
    expect(summary.topRows[0]?.obligationId).toBe('oi-1')
  })
})
