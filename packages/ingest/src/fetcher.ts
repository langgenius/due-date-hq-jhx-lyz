import type { IngestCtx, SourceAdapter } from './types'

export type SourceFetcherKind = NonNullable<SourceAdapter['fetcher']>
export type IngestFetch = IngestCtx['fetch']

export interface FetcherRegistryOptions {
  readonly browserlessFetch?: IngestFetch
  readonly govdeliveryFetch?: IngestFetch
}

export function createSourceFetcherRegistry(
  cloudflareFetch: IngestFetch,
  opts: FetcherRegistryOptions = {},
): (adapter: SourceAdapter) => IngestFetch {
  return (adapter) => {
    const kind: SourceFetcherKind = adapter.fetcher ?? 'cloudflare'
    if (kind === 'browserless') return opts.browserlessFetch ?? cloudflareFetch
    if (kind === 'govdelivery') return opts.govdeliveryFetch ?? cloudflareFetch
    return cloudflareFetch
  }
}
