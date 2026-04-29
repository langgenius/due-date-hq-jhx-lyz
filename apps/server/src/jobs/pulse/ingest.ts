import { createDb, makePulseOpsRepo } from '@duedatehq/db'
import { hashText } from '@duedatehq/ingest/http'
import { phase0PulseAdapters } from '@duedatehq/ingest/adapters'
import type { IngestCtx, SourceAdapter } from '@duedatehq/ingest/types'
import type { Env } from '../../env'

export interface PulseExtractQueueMessage {
  type: 'pulse.extract'
  snapshotId: string
}

interface IngestCounts {
  snapshots: number
  queued: number
  duplicates: number
}

function safePathPart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'snapshot'
  )
}

export async function archivePulseRaw(
  env: Pick<Env, 'R2_PULSE'>,
  input: {
    sourceId: string
    externalId: string
    fetchedAt: Date
    body: string
    contentType?: string | null
  },
): Promise<{ r2Key: string; contentHash: string }> {
  const contentHash = await hashText(input.body)
  const r2Key = [
    'pulse',
    safePathPart(input.sourceId),
    input.fetchedAt.toISOString().slice(0, 10),
    `${safePathPart(input.externalId).slice(0, 80)}-${contentHash.slice(0, 16)}.txt`,
  ].join('/')

  await env.R2_PULSE.put(r2Key, input.body, {
    httpMetadata: { contentType: input.contentType ?? 'text/plain; charset=utf-8' },
    customMetadata: {
      sourceId: input.sourceId,
      externalId: input.externalId,
      fetchedAt: input.fetchedAt.toISOString(),
      contentHash,
    },
  })

  return { r2Key, contentHash }
}

function sumCounts(rows: readonly IngestCounts[]): IngestCounts {
  return rows.reduce(
    (acc, row) => ({
      snapshots: acc.snapshots + row.snapshots,
      queued: acc.queued + row.queued,
      duplicates: acc.duplicates + row.duplicates,
    }),
    { snapshots: 0, queued: 0, duplicates: 0 },
  )
}

async function ingestAdapter(
  adapter: SourceAdapter,
  ctx: IngestCtx,
  repo: ReturnType<typeof makePulseOpsRepo>,
  queue: Pick<Queue, 'send'>,
): Promise<IngestCounts> {
  const rawSnapshots = await adapter.fetch(ctx)
  const parsedGroups = await Promise.all(
    rawSnapshots.map(async (rawSnapshot) => ({
      rawSnapshot,
      items: await adapter.parse(rawSnapshot),
    })),
  )

  const writes = parsedGroups.flatMap(({ rawSnapshot, items }) =>
    items.map(async (item): Promise<IngestCounts> => {
      const result = await repo.createSourceSnapshot({
        sourceId: item.sourceId,
        externalId: item.externalId,
        title: item.title,
        officialSourceUrl: item.officialSourceUrl,
        publishedAt: item.publishedAt,
        fetchedAt: rawSnapshot.fetchedAt,
        contentHash: rawSnapshot.contentHash,
        rawR2Key: rawSnapshot.r2Key,
      })
      if (!result.inserted) {
        return { snapshots: 1, queued: 0, duplicates: 1 }
      }
      await queue.send({
        type: 'pulse.extract',
        snapshotId: result.snapshot.id,
      } satisfies PulseExtractQueueMessage)
      return { snapshots: 1, queued: 1, duplicates: 0 }
    }),
  )

  return sumCounts(await Promise.all(writes))
}

export async function runPulseIngest(
  env: Pick<Env, 'DB' | 'R2_PULSE' | 'PULSE_QUEUE'>,
  adapters: readonly SourceAdapter[] = phase0PulseAdapters,
): Promise<{ snapshots: number; queued: number; duplicates: number }> {
  const db = createDb(env.DB)
  const repo = makePulseOpsRepo(db)
  const ctx: IngestCtx = {
    fetch,
    archiveRaw: (input: Parameters<IngestCtx['archiveRaw']>[0]) => archivePulseRaw(env, input),
  }

  const results = await Promise.all(
    adapters.map((adapter) => ingestAdapter(adapter, ctx, repo, env.PULSE_QUEUE)),
  )
  return sumCounts(results)
}
