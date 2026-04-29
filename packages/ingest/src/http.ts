import type { IngestCtx, RawSnapshot } from './types'

export const DEFAULT_HEADERS = {
  'User-Agent': 'DueDateHQ-PulseBot/1.0 (+https://duedatehq.com/bot; ops@duedatehq.com)',
  Accept: 'text/html,application/xhtml+xml,application/xml,application/rss+xml',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
} as const

export const RATE_LIMIT = {
  minIntervalMs: 30_000,
  maxConcurrent: 1,
  backoffOn429Ms: 15 * 60_000,
} as const

export async function hashText(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function stableExternalId(url: string): string {
  const parsed = new URL(url)
  parsed.hash = ''
  return parsed.toString()
}

export function textExcerpt(text: string, max = 6000): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function fetchTextSnapshot(
  ctx: IngestCtx,
  input: { sourceId: string; url: string },
): Promise<RawSnapshot> {
  const response = await ctx.fetch(input.url, { headers: DEFAULT_HEADERS })
  if (!response.ok) {
    throw new Error(`Pulse source fetch failed for ${input.sourceId}: ${response.status}`)
  }

  const body = await response.text()
  const fetchedAt = new Date()
  const externalId = stableExternalId(input.url)
  const archived = await ctx.archiveRaw({
    sourceId: input.sourceId,
    externalId,
    fetchedAt,
    body,
    contentType: response.headers.get('content-type'),
  })

  return {
    sourceId: input.sourceId,
    fetchedAt,
    body,
    contentHash: archived.contentHash,
    r2Key: archived.r2Key,
    contentType: response.headers.get('content-type'),
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
  }
}
