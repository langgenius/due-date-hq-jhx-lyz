import { describe, expect, it } from 'vitest'
import { hashText } from './http'
import { runFixtureAdapter, sourceFixtureBodies } from './fixtures'
import { livePulseAdapters, nyDtfPressFixtureAdapter, txComptrollerRssAdapter } from './adapters'
import { createSourceFetcherRegistry } from './fetcher'
import { extractLinks, pickSelector } from './selectors'
import type { IngestCtx } from './types'

const cloudflareFetch = async () => new Response('cloudflare')
const browserlessFetch = async () => new Response('browserless')

describe('@duedatehq/ingest', () => {
  it('hashes text with stable sha256 output', async () => {
    await expect(hashText('pulse')).resolves.toMatch(/^[a-f0-9]{64}$/)
    await expect(hashText('pulse')).resolves.toBe(await hashText('pulse'))
  })

  it('picks the first selector with results', () => {
    const doc = {
      querySelectorAll(selector: string) {
        return selector === 'main a' ? [{}] : []
      },
    }

    expect(pickSelector(doc, ['#missing', 'main a'])).toBe('main a')
    expect(pickSelector(doc, ['#missing'])).toBeNull()
  })

  it('extracts links against a base URL', () => {
    expect(extractLinks('<a href="/press/item">Press item</a>', 'https://tax.ny.gov')).toEqual([
      { href: 'https://tax.ny.gov/press/item', text: 'Press item' },
    ])
  })

  it('runs the NY DTF fixture adapter end-to-end', async () => {
    const ctx: IngestCtx = {
      async fetch() {
        throw new Error('fixture should not fetch')
      },
      async archiveRaw({ sourceId, externalId, fetchedAt, body }) {
        return {
          r2Key: `${sourceId}/${externalId}/${fetchedAt.toISOString()}.html`,
          contentHash: await hashText(body),
        }
      },
    }

    const result = await runFixtureAdapter(nyDtfPressFixtureAdapter, ctx)

    expect(result.snapshots).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      sourceId: 'ny.dtf.press',
      title: 'NY DTF clarifies pass-through entity tax election window',
    })
  })

  it('keeps a fixture body registered for every live source adapter', () => {
    expect(Object.keys(sourceFixtureBodies).toSorted()).toEqual(
      livePulseAdapters.map((adapter) => adapter.id).toSorted(),
    )
  })

  it('discovers the TX Comptroller GovDelivery feed from the official RSS directory', async () => {
    const fetchedUrls: string[] = []
    const ctx: IngestCtx = {
      async fetch(input) {
        const url = String(input)
        fetchedUrls.push(url)
        if (url.endsWith('/robots.txt')) return new Response('', { status: 404 })
        if (url === 'https://comptroller.texas.gov/about/media-center/rss/') {
          return new Response(
            '<a href="https://public.govdelivery.com/accounts/TXCOMPT/subscriber/new?topic_id=TXCOMPT_70">Texas Comptroller News in English</a>',
            { headers: { 'content-type': 'text/html' } },
          )
        }
        if (
          url ===
          'https://public.govdelivery.com/accounts/TXCOMPT/subscriber/new?topic_id=TXCOMPT_70'
        ) {
          return new Response(
            '<rss><channel><item><title>Texas tax deadline extension</title><link>https://content.govdelivery.com/accounts/TXCOMPT/bulletins/abc123</link><pubDate>Wed, 15 Apr 2026 00:00:00 GMT</pubDate><description>Deadline relief.</description></item></channel></rss>',
            { headers: { 'content-type': 'application/rss+xml' } },
          )
        }
        throw new Error(`unexpected fetch ${url}`)
      },
      async getSourceState() {
        return null
      },
      async archiveRaw({ sourceId, externalId, fetchedAt, body }) {
        return {
          r2Key: `${sourceId}/${externalId}/${fetchedAt.toISOString()}.xml`,
          contentHash: await hashText(body),
        }
      },
    }

    const snapshots = await txComptrollerRssAdapter.fetch(ctx)
    const items = await txComptrollerRssAdapter.parse(snapshots[0]!, ctx)

    expect(fetchedUrls).toContain('https://comptroller.texas.gov/about/media-center/rss/')
    expect(snapshots[0]).toMatchObject({
      sourceId: 'tx.cpa.rss',
      contentType: 'application/rss+xml',
    })
    expect(items[0]).toMatchObject({
      sourceId: 'tx.cpa.rss',
      title: 'Texas tax deadline extension',
      officialSourceUrl: 'https://content.govdelivery.com/accounts/TXCOMPT/bulletins/abc123',
    })
  })

  it('routes browserless adapters through the configured fetch implementation', async () => {
    const selectFetch = createSourceFetcherRegistry(cloudflareFetch, { browserlessFetch })

    await expect(
      selectFetch({ ...nyDtfPressFixtureAdapter, fetcher: 'browserless' })('/'),
    ).resolves.toHaveProperty('ok', true)
    await expect(
      selectFetch({ ...nyDtfPressFixtureAdapter, fetcher: 'browserless' })('/').then((res) =>
        res.text(),
      ),
    ).resolves.toBe('browserless')
  })
})
