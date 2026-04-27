import { describe, expect, it } from 'vitest'
import {
  getMvpRuleCoverage,
  listObligationRules,
  listRuleSources,
  listSourcesByNotificationChannel,
  MVP_RULE_JURISDICTIONS,
  OBLIGATION_RULES,
  RULE_SOURCES,
} from './index'

const OFFICIAL_HOSTS = new Set([
  'www.irs.gov',
  'www.fema.gov',
  'www.ftb.ca.gov',
  'www.tax.ny.gov',
  'comptroller.texas.gov',
  'floridarevenue.com',
  'dor.wa.gov',
])

function expectUnique(ids: readonly string[]) {
  expect(new Set(ids).size).toBe(ids.length)
}

describe('@duedatehq/core/rules', () => {
  it('keeps MVP jurisdiction scope explicit', () => {
    expect(MVP_RULE_JURISDICTIONS).toEqual(['FED', 'CA', 'NY', 'TX', 'FL', 'WA'])
  })

  it('stores only official source URLs in the MVP registry', () => {
    expectUnique(RULE_SOURCES.map((source) => source.id))

    for (const source of RULE_SOURCES) {
      const url = new URL(source.url)
      expect(OFFICIAL_HOSTS.has(url.host), `${source.id} uses unofficial host ${url.host}`).toBe(
        true,
      )
      expect(source.healthStatus).toBe('healthy')
      expect(source.notificationChannels.length).toBeGreaterThan(0)
    }
  })

  it('links every rule to existing official sources', () => {
    const sourceIds = new Set<string>(RULE_SOURCES.map((source) => source.id))

    expectUnique(OBLIGATION_RULES.map((rule) => rule.id))

    for (const rule of OBLIGATION_RULES) {
      expect(rule.sourceIds.length, `${rule.id} has no sources`).toBeGreaterThan(0)
      expect(rule.evidence.length, `${rule.id} has no evidence`).toBeGreaterThan(0)

      for (const sourceId of rule.sourceIds) {
        expect(sourceIds.has(sourceId), `${rule.id} references missing source ${sourceId}`).toBe(
          true,
        )
      }

      for (const evidence of rule.evidence) {
        expect(sourceIds.has(evidence.sourceId), `${rule.id} has missing evidence source`).toBe(
          true,
        )
      }
    }
  })

  it('covers every MVP jurisdiction with verified rules and source watches', () => {
    const coverage = getMvpRuleCoverage()

    expect(coverage).toHaveLength(MVP_RULE_JURISDICTIONS.length)

    for (const row of coverage) {
      expect(row.sourceCount, `${row.jurisdiction} has no sources`).toBeGreaterThan(0)
      expect(row.verifiedRuleCount, `${row.jurisdiction} has no verified rules`).toBeGreaterThan(0)
      expect(
        row.highPrioritySourceCount,
        `${row.jurisdiction} lacks priority sources`,
      ).toBeGreaterThan(0)
    }
  })

  it('keeps user reminders behind verified rules only', () => {
    const userReminderSources = listSourcesByNotificationChannel('user_deadline_reminder')
    const verifiedRules = listObligationRules({ status: 'verified' })
    const defaultRules = listObligationRules()
    const withCandidates = listObligationRules({ includeCandidates: true })

    expect(userReminderSources).toHaveLength(0)
    expect(verifiedRules.every((rule) => rule.status === 'verified')).toBe(true)
    expect(defaultRules.every((rule) => rule.status !== 'candidate')).toBe(true)
    expect(withCandidates.some((rule) => rule.status === 'candidate')).toBe(true)
  })

  it('exposes source and rule filters for Rules Console reads', () => {
    expect(listRuleSources('CA').every((source) => source.jurisdiction === 'CA')).toBe(true)
    expect(
      listObligationRules({ jurisdiction: 'WA' }).every((rule) => rule.jurisdiction === 'WA'),
    ).toBe(true)
  })
})
