import { describe, expect, it } from 'vitest'
import { listRuleSources, MVP_RULE_JURISDICTIONS } from '@duedatehq/core/rules'
import { livePulseAdapters } from '@duedatehq/ingest/adapters'
import {
  createRuleSourceAdapter,
  isRuleSourceAdapterEligible,
  isRuleSourcePulsePromoted,
  liveRegulatorySourceAdapters,
  ruleSourceAdapters,
} from './rule-source-adapters'

describe('rule source adapters', () => {
  it('adds source-signal adapters for every candidate-review rule source without duplicating live adapters', () => {
    const liveIds = new Set(livePulseAdapters.map((adapter) => adapter.id))
    const candidateReviewSources = listRuleSources()
      .filter((source) => source.notificationChannels.includes('candidate_review'))
      .filter((source) => !liveIds.has(source.id))
      .filter(isRuleSourceAdapterEligible)

    expect(ruleSourceAdapters.map((adapter) => adapter.id).toSorted()).toEqual(
      candidateReviewSources.map((source) => source.id).toSorted(),
    )
    expect(liveRegulatorySourceAdapters).toHaveLength(
      livePulseAdapters.length + candidateReviewSources.length,
    )
  })

  it('covers every rules jurisdiction with at least one regulatory source adapter', () => {
    const jurisdictions = new Set(
      liveRegulatorySourceAdapters.map((adapter) => adapter.jurisdiction),
    )

    for (const jurisdiction of MVP_RULE_JURISDICTIONS) {
      if (jurisdiction === 'FED') continue
      expect(jurisdictions.has(jurisdiction), `${jurisdiction} has no adapter`).toBe(true)
    }
  })

  it('promotes every state jurisdiction to at least one Pulse-producing source adapter', () => {
    const promotedJurisdictions = new Set(
      liveRegulatorySourceAdapters
        .filter((adapter) => adapter.canCreatePulse !== false)
        .map((adapter) => adapter.jurisdiction),
    )

    for (const jurisdiction of MVP_RULE_JURISDICTIONS) {
      if (jurisdiction === 'FED') continue
      expect(
        promotedJurisdictions.has(jurisdiction),
        `${jurisdiction} has no promoted source`,
      ).toBe(true)
    }
  })

  it('keeps lower-priority rule source adapters signal-only', () => {
    const source = listRuleSources().find(
      (candidate) =>
        isRuleSourceAdapterEligible(candidate) &&
        candidate.jurisdiction !== 'FED' &&
        candidate.priority === 'medium',
    )
    expect(source).toBeDefined()
    expect(isRuleSourcePulsePromoted(source!)).toBe(false)
    expect(createRuleSourceAdapter(source!).canCreatePulse).toBe(false)
  })
})
