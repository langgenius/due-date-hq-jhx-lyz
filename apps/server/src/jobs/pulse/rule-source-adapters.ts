import { listRuleSources, type RuleSource } from '@duedatehq/core/rules'
import { fetchTextSnapshot, stableExternalId, textExcerpt } from '@duedatehq/ingest/http'
import { livePulseAdapters } from '@duedatehq/ingest/adapters'
import { stripHtml } from '@duedatehq/ingest/selectors'
import type { ParsedItem, SourceAdapter } from '@duedatehq/ingest/types'

const EXISTING_ADAPTER_IDS = new Set(livePulseAdapters.map((adapter) => adapter.id))

function intervalForCadence(cadence: RuleSource['cadence']): number {
  const hour = 60 * 60 * 1000
  const day = 24 * hour
  switch (cadence) {
    case 'daily':
      return day
    case 'weekly':
      return 7 * day
    case 'monthly':
      return 30 * day
    case 'quarterly':
      return 90 * day
    case 'pre_season':
      return 14 * day
  }
  return 14 * day
}

function tierForPriority(priority: RuleSource['priority']): SourceAdapter['tier'] {
  if (priority === 'critical' || priority === 'high') return 'T1'
  if (priority === 'medium') return 'T2'
  return 'T3'
}

function sourceSnapshotTitle(source: RuleSource): string {
  return `${source.title} official source snapshot`
}

function parsedItemForSourceSnapshot(
  source: RuleSource,
  body: string,
  fetchedAt: Date,
): ParsedItem {
  const text = textExcerpt(stripHtml(body))
  return {
    sourceId: source.id,
    externalId: stableExternalId(source.url),
    title: sourceSnapshotTitle(source),
    publishedAt: fetchedAt,
    officialSourceUrl: source.url,
    rawText: text || sourceSnapshotTitle(source),
    jurisdiction: source.jurisdiction,
  }
}

export function createRuleSourceAdapter(source: RuleSource): SourceAdapter {
  return {
    id: source.id,
    tier: tierForPriority(source.priority),
    cronIntervalMs: intervalForCadence(source.cadence),
    jurisdiction: source.jurisdiction,
    canCreatePulse: false,
    async fetch(ctx) {
      return [await fetchTextSnapshot(ctx, { sourceId: source.id, url: source.url })]
    },
    async parse(snapshot) {
      if (snapshot.notModified) return []
      return [parsedItemForSourceSnapshot(source, snapshot.body, snapshot.fetchedAt)]
    },
  }
}

export const ruleSourceAdapters = listRuleSources()
  .filter((source) => source.notificationChannels.includes('candidate_review'))
  .filter((source) => !EXISTING_ADAPTER_IDS.has(source.id))
  .map(createRuleSourceAdapter)

export const liveRegulatorySourceAdapters = [...livePulseAdapters, ...ruleSourceAdapters] as const
