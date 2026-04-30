import { describe, expect, it } from 'vitest'
import { hashText } from './http'
import { runFixtureAdapter, sourceFixtureBodies } from './fixtures'
import { livePulseAdapters, nyDtfPressFixtureAdapter } from './adapters'
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
