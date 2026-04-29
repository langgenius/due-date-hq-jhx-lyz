export type SourceTier = 'T1' | 'T2' | 'T3'
export type SourceJurisdiction = string

export type SourceId = 'irs.disaster' | 'tx.cpa.rss' | 'ny.dtf.press'

export interface IngestCtx {
  fetch(input: string | URL, init?: RequestInit): Promise<Response>
  archiveRaw(input: {
    sourceId: string
    externalId: string
    fetchedAt: Date
    body: string
    contentType?: string | null
  }): Promise<{ r2Key: string; contentHash: string }>
}

export interface RawSnapshot {
  sourceId: string
  fetchedAt: Date
  contentHash: string
  r2Key: string
  body: string
  contentType: string | null
  etag: string | null
  lastModified: string | null
}

export interface ParsedItem {
  sourceId: string
  externalId: string
  title: string
  publishedAt: Date
  officialSourceUrl: string
  rawText: string
}

export interface SourceAdapter {
  readonly id: SourceId
  readonly tier: SourceTier
  readonly cronIntervalMs: number
  readonly jurisdiction: SourceJurisdiction
  fetch(ctx: IngestCtx): Promise<RawSnapshot[]>
  parse(snapshot: RawSnapshot): Promise<ParsedItem[]>
}
