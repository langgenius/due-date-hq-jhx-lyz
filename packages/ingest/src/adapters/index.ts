import { fetchTextSnapshot, stableExternalId, textExcerpt } from '../http'
import { snapshotFromFixture } from '../fixtures'
import { extractLinks, stripHtml } from '../selectors'
import type { ParsedItem, SourceAdapter } from '../types'

const IRS_DISASTER_URL = 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations'
const TX_CPA_RSS_URL = 'https://comptroller.texas.gov/about/media-center/rss/'
const NY_DTF_PRESS_URL = 'https://www.tax.ny.gov/press/'

function publishedAtFromText(text: string): Date {
  const match =
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/i.exec(
      text,
    )
  const parsed = match ? new Date(`${match[0]}T00:00:00.000Z`) : null
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date()
}

function parsedItemFromHtml(input: {
  sourceId: string
  sourceUrl: string
  title: string
  html: string
}): ParsedItem {
  const rawText = textExcerpt(stripHtml(input.html))
  return {
    sourceId: input.sourceId,
    externalId: stableExternalId(input.sourceUrl),
    title: input.title,
    publishedAt: publishedAtFromText(rawText),
    officialSourceUrl: input.sourceUrl,
    rawText,
  }
}

export const irsDisasterAdapter: SourceAdapter = {
  id: 'irs.disaster',
  tier: 'T1',
  cronIntervalMs: 60 * 60 * 1000,
  jurisdiction: 'federal',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: IRS_DISASTER_URL })]
  },
  async parse(snapshot) {
    const links = extractLinks(snapshot.body, IRS_DISASTER_URL).filter((link) =>
      /relief|disaster|storm|wildfire|flood|tax/i.test(`${link.text} ${link.href}`),
    )
    if (links.length === 0) {
      return [
        parsedItemFromHtml({
          sourceId: this.id,
          sourceUrl: IRS_DISASTER_URL,
          title: 'IRS disaster tax relief update',
          html: snapshot.body,
        }),
      ]
    }

    return links.slice(0, 10).map((link) => ({
      sourceId: this.id,
      externalId: stableExternalId(link.href),
      title: link.text,
      publishedAt: publishedAtFromText(`${link.text} ${snapshot.body}`),
      officialSourceUrl: link.href,
      rawText: textExcerpt(`${link.text}\n\n${stripHtml(snapshot.body)}`),
    }))
  },
}

export const txComptrollerRssAdapter: SourceAdapter = {
  id: 'tx.cpa.rss',
  tier: 'T1',
  cronIntervalMs: 60 * 60 * 1000,
  jurisdiction: 'TX',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: TX_CPA_RSS_URL })]
  },
  async parse(snapshot) {
    const items = Array.from(snapshot.body.matchAll(/<item\b[\s\S]*?<\/item>/gi))
    return items.slice(0, 20).map((match) => {
      const item = match[0]
      const title = stripHtml(
        /<title>([\s\S]*?)<\/title>/i.exec(item)?.[1] ?? 'TX Comptroller update',
      )
      const link = stripHtml(/<link>([\s\S]*?)<\/link>/i.exec(item)?.[1] ?? TX_CPA_RSS_URL)
      const pubDate = stripHtml(/<pubDate>([\s\S]*?)<\/pubDate>/i.exec(item)?.[1] ?? '')
      const description = stripHtml(
        /<description>([\s\S]*?)<\/description>/i.exec(item)?.[1] ?? title,
      )
      const parsedDate = new Date(pubDate)
      return {
        sourceId: this.id,
        externalId: stableExternalId(link || TX_CPA_RSS_URL),
        title,
        publishedAt: Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        officialSourceUrl: link || TX_CPA_RSS_URL,
        rawText: textExcerpt(`${title}\n\n${description}`),
      }
    })
  },
}

const NY_DTF_FIXTURE = `
<article>
  <h1>NY DTF clarifies pass-through entity tax election window</h1>
  <time>April 15, 2026</time>
  <p>The Department of Taxation and Finance reminds taxpayers that the PTET election
  for tax year 2026 must be made by March 15, 2026.</p>
</article>
`

export const nyDtfPressFixtureAdapter: SourceAdapter = {
  id: 'ny.dtf.press',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'NY',
  async fetch(ctx) {
    return [
      await snapshotFromFixture({
        ctx,
        sourceId: this.id,
        externalId: NY_DTF_PRESS_URL,
        body: NY_DTF_FIXTURE,
      }),
    ]
  },
  async parse(snapshot) {
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: NY_DTF_PRESS_URL,
        title: 'NY DTF clarifies pass-through entity tax election window',
        html: snapshot.body,
      }),
    ]
  },
}

export const phase0PulseAdapters = [
  irsDisasterAdapter,
  txComptrollerRssAdapter,
  nyDtfPressFixtureAdapter,
] as const
