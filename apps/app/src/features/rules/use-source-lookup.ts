import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { RuleSource } from '@duedatehq/contracts'

import { orpc } from '@/lib/rpc'

const EMPTY_SOURCES: readonly RuleSource[] = []

/**
 * Shared `Map<sourceId, RuleSource>` lookup for the Rules Console.
 *
 * Backed by the same `rules.listSources` query that powers the Sources tab,
 * so consumers in the Rule Detail drawer and Obligation Preview hit the
 * TanStack Query cache instead of issuing a second round-trip
 * (vercel rule: `client-swr-dedup`).
 *
 * Returns an empty Map while loading; consumers fall back to plain text
 * rendering for evidence rows whose source is not yet present.
 */
export function useSourceLookup(): ReadonlyMap<string, RuleSource> {
  const sourcesQuery = useQuery(orpc.rules.listSources.queryOptions({ input: undefined }))

  return useMemo(() => {
    const sources = sourcesQuery.data ?? EMPTY_SOURCES
    return new Map(sources.map((source) => [source.id, source]))
  }, [sourcesQuery.data])
}
