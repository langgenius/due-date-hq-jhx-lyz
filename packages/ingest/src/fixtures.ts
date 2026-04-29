import type { IngestCtx, RawSnapshot, SourceAdapter } from './types'

export async function snapshotFromFixture(input: {
  ctx: IngestCtx
  sourceId: string
  externalId: string
  fetchedAt?: Date
  body: string
  contentType?: string
}): Promise<RawSnapshot> {
  const fetchedAt = input.fetchedAt ?? new Date()
  const archived = await input.ctx.archiveRaw({
    sourceId: input.sourceId,
    externalId: input.externalId,
    fetchedAt,
    body: input.body,
    contentType: input.contentType ?? 'text/html',
  })

  return {
    sourceId: input.sourceId,
    fetchedAt,
    body: input.body,
    contentHash: archived.contentHash,
    r2Key: archived.r2Key,
    contentType: input.contentType ?? 'text/html',
    etag: null,
    lastModified: null,
  }
}

export async function runFixtureAdapter(adapter: SourceAdapter, ctx: IngestCtx) {
  const snapshots = await adapter.fetch(ctx)
  const parsedGroups = await Promise.all(snapshots.map((snapshot) => adapter.parse(snapshot)))
  const items = parsedGroups.flat()
  return { snapshots, items }
}
