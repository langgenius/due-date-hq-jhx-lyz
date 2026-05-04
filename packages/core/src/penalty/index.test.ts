import { describe, expect, it } from 'vitest'
import {
  estimateAccruedPenalty,
  estimatePenaltyExposure,
  estimateProjectedExposure,
  summarizePenaltyExposure,
} from './index'

describe('@duedatehq/core/penalty', () => {
  it('calculates federal owner-month projected exposure over the default 90-day horizon', () => {
    const result = estimateProjectedExposure({
      taxType: 'federal_1065',
      entityType: 'partnership',
      dueDate: '2026-03-16',
      equityOwnerCount: 3,
    })

    expect(result.status).toBe('ready')
    expect(result.estimatedExposureCents).toBe(229_500)
    expect(result.breakdown[0]?.formula).toContain('$255 x 3 partner')
  })

  it('keeps the legacy estimatePenaltyExposure export as projected exposure', () => {
    const result = estimatePenaltyExposure({
      taxType: 'federal_1065',
      dueDate: '2026-03-16',
      equityOwnerCount: 1,
    })

    expect(result.estimatedExposureCents).toBe(76_500)
  })

  it('returns zero accrued penalty when the current due date has not passed', () => {
    const result = estimateAccruedPenalty(
      {
        taxType: 'federal_1120',
        entityType: 'c_corp',
        dueDate: '2026-04-15',
      },
      { asOfDate: '2026-04-15' },
    )

    expect(result.status).toBe('ready')
    expect(result.estimatedExposureCents).toBe(0)
  })

  it('counts one late day as one penalty month', () => {
    const result = estimateAccruedPenalty(
      {
        taxType: 'federal_1120',
        entityType: 'c_corp',
        dueDate: '2026-04-15',
        estimatedTaxLiabilityCents: 10_000_00,
      },
      { asOfDate: '2026-04-16' },
    )

    expect(result.status).toBe('ready')
    expect(result.estimatedExposureCents).toBe(50_000)
  })

  it('calculates tax-due projected exposure with failure-to-pay offset', () => {
    const result = estimateProjectedExposure({
      taxType: 'federal_1120',
      entityType: 'c_corp',
      dueDate: '2026-04-15',
      estimatedTaxLiabilityCents: 10_000_00,
      horizonDays: 90,
    })

    expect(result.status).toBe('ready')
    expect(result.estimatedExposureCents).toBe(150_000)
    expect(result.breakdown.map((item) => item.key)).toEqual([
      'failure-to-file',
      'failure-to-pay-offset',
      'failure-to-pay',
    ])
  })

  it('applies the over-60-day minimum while preserving the offset total', () => {
    const result = estimateProjectedExposure({
      taxType: 'federal_1120',
      dueDate: '2026-04-15',
      estimatedTaxLiabilityCents: 300_00,
      horizonDays: 90,
    })

    expect(result.status).toBe('ready')
    expect(result.estimatedExposureCents).toBe(300_00)
  })

  it('adds optional tax-due exposure to federal S corporation shareholder-month penalties', () => {
    const result = estimateProjectedExposure({
      taxType: 'federal_1120s',
      entityType: 's_corp',
      dueDate: '2026-03-16',
      equityOwnerCount: 2,
      estimatedTaxLiabilityCents: 10_000_00,
    })

    expect(result.status).toBe('ready')
    expect(result.estimatedExposureCents).toBe(303_000)
    expect(result.breakdown.map((item) => item.key)).toContain('owner-months')
    expect(result.breakdown.map((item) => item.key)).toContain('failure-to-pay')
  })

  it('guards zero and negative inputs as missing facts once penalties could accrue', () => {
    expect(
      estimateAccruedPenalty(
        {
          taxType: 'federal_1065',
          dueDate: '2026-03-16',
          equityOwnerCount: 0,
        },
        { asOfDate: '2026-03-17' },
      ).status,
    ).toBe('needs_input')
    expect(
      estimateAccruedPenalty(
        {
          taxType: 'federal_1120',
          dueDate: '2026-04-15',
          estimatedTaxLiabilityCents: -1,
        },
        { asOfDate: '2026-04-16' },
      ).status,
    ).toBe('needs_input')
  })

  it('returns unsupported for state tax types and federal estimated-tax underpayment', () => {
    expect(
      estimateProjectedExposure({
        taxType: 'ca_100',
        dueDate: '2026-04-15',
        estimatedTaxLiabilityCents: 10_000_00,
      }).status,
    ).toBe('unsupported')
    expect(
      estimateProjectedExposure({
        taxType: 'federal_1120_estimated_tax',
        dueDate: '2026-04-15',
        estimatedTaxLiabilityCents: 10_000_00,
      }).status,
    ).toBe('unsupported')
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
