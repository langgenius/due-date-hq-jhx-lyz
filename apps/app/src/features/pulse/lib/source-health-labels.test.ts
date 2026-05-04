import { describe, expect, it } from 'vitest'

import {
  enabledPulseSourceCount,
  sourcesNeedingAttention,
  summarizePulseSources,
} from './source-health-labels'

function source(
  sourceId: string,
  options: {
    enabled?: boolean
    healthStatus?: 'healthy' | 'degraded' | 'failing' | 'paused'
    label?: string
    lastCheckedAt?: string | null
  } = {},
) {
  return {
    sourceId,
    label: options.label ?? sourceId,
    enabled: options.enabled ?? true,
    healthStatus: options.healthStatus ?? 'healthy',
    lastCheckedAt: 'lastCheckedAt' in options ? options.lastCheckedAt : '2026-05-04T00:00:00.000Z',
  }
}

describe('pulse source health labels', () => {
  it('deduplicates known source families and caps long source lists', () => {
    expect(
      summarizePulseSources([
        source('ca.ftb.newsroom'),
        source('ca.ftb.tax_news'),
        source('tx.cpa.rss'),
        source('wa.dor.news'),
        source('ma.dor.press'),
        source('fema.declarations'),
        source('ca.income_tax'),
        source('co.income_tax'),
      ]),
    ).toBe('CA FTB + TX + WA + MA + FEMA + 2 more')
  })

  it('excludes disabled and paused sources from summaries and counts', () => {
    const sources = [
      source('ca.ftb.newsroom'),
      source('tx.cpa.rss', { enabled: false }),
      source('fema.declarations', { healthStatus: 'paused' }),
    ]

    expect(summarizePulseSources(sources)).toBe('CA FTB')
    expect(enabledPulseSourceCount(sources)).toBe(1)
  })

  it('returns only checked degraded or failing sources for attention', () => {
    expect(
      sourcesNeedingAttention([
        source('ca.ftb.newsroom', { healthStatus: 'degraded' }),
        source('tx.cpa.rss', { healthStatus: 'failing' }),
        source('fema.declarations', { healthStatus: 'degraded', lastCheckedAt: null }),
        source('irs.disaster', { healthStatus: 'healthy' }),
      ]).map((item) => item.sourceId),
    ).toEqual(['ca.ftb.newsroom', 'tx.cpa.rss'])
  })
})
