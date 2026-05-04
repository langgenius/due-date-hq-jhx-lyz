import { DEFAULT_HEADERS, fetchTextSnapshot, stableExternalId, textExcerpt } from '../http'
import { snapshotFromFixture } from '../fixtures'
import { extractLinks, stripHtml } from '../selectors'
import type { IngestCtx, ParsedItem, SourceAdapter } from '../types'

const IRS_DISASTER_URL = 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations'
const IRS_NEWSROOM_URL = 'https://www.irs.gov/newsroom'
const IRS_GUIDANCE_URL = 'https://www.irs.gov/newsroom/irs-guidance'
const TX_CPA_RSS_DIRECTORY_URL = 'https://comptroller.texas.gov/about/media-center/rss/'
const TX_CPA_GOVDELIVERY_FALLBACK_URL =
  'https://public.govdelivery.com/accounts/TXCOMPT/subscriber/new?topic_id=TXCOMPT_70'
const NY_DTF_PRESS_URL = 'https://www.tax.ny.gov/press/'
const CA_FTB_NEWSROOM_URL = 'https://www.ftb.ca.gov/about-ftb/newsroom/index.html'
const CA_FTB_TAX_NEWS_URL = 'https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/index.html'
const CA_CDTFA_NEWS_URL = 'https://www.cdtfa.ca.gov/news/'
const FL_DOR_TIPS_URL = 'https://floridarevenue.com/taxes/tips/Pages/default.aspx'
const WA_DOR_NEWS_URL = 'https://dor.wa.gov/about/news-releases'
const WA_DOR_WHATS_NEW_URL = 'https://dor.wa.gov/about/whats-new'
const MA_DOR_PRESS_URL = 'https://www.mass.gov/info-details/dor-press-releases-and-reports'
const FEMA_DECLARATIONS_URL =
  'https://www.fema.gov/openfema-data-page/disaster-declarations-summaries-v2'
const FEMA_API_URL =
  'https://www.fema.gov/openfema-data-hub/arcgis/rest/services/public/DisasterDeclarationsSummaries_v2/FeatureServer/0/query?where=declarationDate%20%3E%3D%20CURRENT_TIMESTAMP%20-%2090&outFields=disasterNumber,state,declarationTitle,incidentType,declarationDate,incidentBeginDate,designatedArea&f=json&resultRecordCount=50&orderByFields=declarationDate%20DESC'

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

async function fetchDetailText(ctx: IngestCtx, url: string, fallbackText: string): Promise<string> {
  try {
    const response = await ctx.fetch(url, { headers: DEFAULT_HEADERS })
    if (!response.ok) return fallbackText
    return textExcerpt(stripHtml(await response.text()))
  } catch {
    return fallbackText
  }
}

function linkLooksTaxRelevant(text: string, href: string): boolean {
  return /deadline|relief|disaster|storm|wildfire|flood|tax|filing|payment|extension|franchise|due/i.test(
    `${text} ${href}`,
  )
}

function parsedItemsFromLinks(input: {
  sourceId: string
  baseUrl: string
  html: string
  ctx: IngestCtx
  limit?: number
}): Promise<ParsedItem[]> {
  const links = extractLinks(input.html, input.baseUrl)
    .filter((link) => linkLooksTaxRelevant(link.text, link.href))
    .slice(0, input.limit ?? 12)
  return Promise.all(
    links.map(async (link) => {
      const fallback = textExcerpt(`${link.text}\n\n${stripHtml(input.html)}`)
      return {
        sourceId: input.sourceId,
        externalId: stableExternalId(link.href),
        title: link.text || 'Tax agency update',
        publishedAt: publishedAtFromText(`${link.text} ${input.html}`),
        officialSourceUrl: link.href,
        rawText: await fetchDetailText(input.ctx, link.href, fallback),
      }
    }),
  )
}

function firstGovDeliveryFeedUrl(html: string): string {
  const links = extractLinks(html, TX_CPA_RSS_DIRECTORY_URL)
  const englishFeed = links.find(
    (link) =>
      /public\.govdelivery\.com\/accounts\/TXCOMPT/i.test(link.href) &&
      /english|news/i.test(link.text),
  )
  const anyFeed = links.find((link) =>
    /public\.govdelivery\.com\/accounts\/TXCOMPT/i.test(link.href),
  )
  return englishFeed?.href ?? anyFeed?.href ?? TX_CPA_GOVDELIVERY_FALLBACK_URL
}

function rssItemsFromGovDelivery(input: { sourceId: string; rss: string }): ParsedItem[] {
  const items = Array.from(input.rss.matchAll(/<item\b[\s\S]*?<\/item>/gi))
  return items.slice(0, 20).map((match) => {
    const item = match[0]
    const title = stripHtml(
      /<title>([\s\S]*?)<\/title>/i.exec(item)?.[1] ?? 'TX Comptroller update',
    )
    const link = stripHtml(
      /<link>([\s\S]*?)<\/link>/i.exec(item)?.[1] ?? TX_CPA_GOVDELIVERY_FALLBACK_URL,
    )
    const pubDate = stripHtml(/<pubDate>([\s\S]*?)<\/pubDate>/i.exec(item)?.[1] ?? '')
    const description = stripHtml(
      /<description>([\s\S]*?)<\/description>/i.exec(item)?.[1] ?? title,
    )
    const parsedDate = new Date(pubDate)
    return {
      sourceId: input.sourceId,
      externalId: stableExternalId(link || TX_CPA_GOVDELIVERY_FALLBACK_URL),
      title,
      publishedAt: Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      officialSourceUrl: link || TX_CPA_GOVDELIVERY_FALLBACK_URL,
      rawText: textExcerpt(`${title}\n\n${description}`),
    }
  })
}

function govDeliveryBulletinsFromHtml(input: { sourceId: string; html: string }): ParsedItem[] {
  return extractLinks(input.html, TX_CPA_GOVDELIVERY_FALLBACK_URL)
    .filter((link) => /content\.govdelivery\.com\/accounts\/TXCOMPT\/bulletins\//i.test(link.href))
    .slice(0, 20)
    .map((link) => ({
      sourceId: input.sourceId,
      externalId: stableExternalId(link.href),
      title: link.text || 'TX Comptroller bulletin',
      publishedAt: publishedAtFromText(`${link.text} ${input.html}`),
      officialSourceUrl: link.href,
      rawText: textExcerpt(`${link.text}\n\n${stripHtml(input.html)}`),
    }))
}

export const irsDisasterAdapter: SourceAdapter = {
  id: 'irs.disaster',
  tier: 'T1',
  cronIntervalMs: 60 * 60 * 1000,
  jurisdiction: 'federal',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: IRS_DISASTER_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
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

    return Promise.all(
      links.slice(0, 10).map(async (link) => {
        const fallback = textExcerpt(`${link.text}\n\n${stripHtml(snapshot.body)}`)
        return {
          sourceId: this.id,
          externalId: stableExternalId(link.href),
          title: link.text,
          publishedAt: publishedAtFromText(`${link.text} ${snapshot.body}`),
          officialSourceUrl: link.href,
          rawText: await fetchDetailText(ctx, link.href, fallback),
        }
      }),
    )
  },
}

export const irsNewsroomAdapter: SourceAdapter = {
  id: 'irs.newsroom',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'federal',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: IRS_NEWSROOM_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    return parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: IRS_NEWSROOM_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
  },
}

export const irsGuidanceAdapter: SourceAdapter = {
  id: 'irs.guidance',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'federal',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: IRS_GUIDANCE_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    return parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: IRS_GUIDANCE_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
  },
}

export const txComptrollerRssAdapter: SourceAdapter = {
  id: 'tx.cpa.rss',
  tier: 'T1',
  cronIntervalMs: 60 * 60 * 1000,
  jurisdiction: 'TX',
  fetcher: 'govdelivery',
  async fetch(ctx) {
    const directoryResponse = await ctx.fetch(TX_CPA_RSS_DIRECTORY_URL, {
      headers: DEFAULT_HEADERS,
    })
    if (!directoryResponse.ok) {
      throw new Error(`Pulse source fetch failed for ${this.id}: ${directoryResponse.status}`)
    }
    const directoryHtml = await directoryResponse.text()
    return [
      await fetchTextSnapshot(ctx, {
        sourceId: this.id,
        url: firstGovDeliveryFeedUrl(directoryHtml),
      }),
    ]
  },
  async parse(snapshot) {
    if (snapshot.notModified) return []
    const rssItems = rssItemsFromGovDelivery({ sourceId: this.id, rss: snapshot.body })
    if (rssItems.length > 0) return rssItems
    return govDeliveryBulletinsFromHtml({ sourceId: this.id, html: snapshot.body })
  },
}

export const caFtbNewsroomAdapter: SourceAdapter = {
  id: 'ca.ftb.newsroom',
  tier: 'T1',
  cronIntervalMs: 60 * 60 * 1000,
  jurisdiction: 'CA',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: CA_FTB_NEWSROOM_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    const items = await parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: CA_FTB_NEWSROOM_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
    if (items.length > 0) return items
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: CA_FTB_NEWSROOM_URL,
        title: 'CA FTB newsroom update',
        html: snapshot.body,
      }),
    ]
  },
}

export const caFtbTaxNewsAdapter: SourceAdapter = {
  id: 'ca.ftb.tax_news',
  tier: 'T1',
  cronIntervalMs: 60 * 60 * 1000,
  jurisdiction: 'CA',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: CA_FTB_TAX_NEWS_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    const items = await parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: CA_FTB_TAX_NEWS_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
    if (items.length > 0) return items
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: CA_FTB_TAX_NEWS_URL,
        title: 'CA FTB tax news update',
        html: snapshot.body,
      }),
    ]
  },
}

export const caCdtfaNewsAdapter: SourceAdapter = {
  id: 'ca.cdtfa.news',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'CA',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: CA_CDTFA_NEWS_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    const items = await parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: CA_CDTFA_NEWS_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
    if (items.length > 0) return items
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: CA_CDTFA_NEWS_URL,
        title: 'CA CDTFA news update',
        html: snapshot.body,
      }),
    ]
  },
}

export const nyDtfPressAdapter: SourceAdapter = {
  id: 'ny.dtf.press',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'NY',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: NY_DTF_PRESS_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    const items = await parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: NY_DTF_PRESS_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
    if (items.length > 0) return items
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: NY_DTF_PRESS_URL,
        title: 'NY DTF press update',
        html: snapshot.body,
      }),
    ]
  },
}

export const flDorTipsAdapter: SourceAdapter = {
  id: 'fl.dor.tips',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'FL',
  fetcher: 'browserless',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: FL_DOR_TIPS_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    const items = await parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: FL_DOR_TIPS_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
    if (items.length > 0) return items
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: FL_DOR_TIPS_URL,
        title: 'FL DOR tax tip update',
        html: snapshot.body,
      }),
    ]
  },
}

export const waDorNewsAdapter: SourceAdapter = {
  id: 'wa.dor.news',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'WA',
  fetcher: 'browserless',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: WA_DOR_NEWS_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    const items = await parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: WA_DOR_NEWS_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
    if (items.length > 0) return items
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: WA_DOR_NEWS_URL,
        title: 'WA DOR news update',
        html: snapshot.body,
      }),
    ]
  },
}

export const waDorWhatsNewAdapter: SourceAdapter = {
  id: 'wa.dor.whats_new',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'WA',
  fetcher: 'browserless',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: WA_DOR_WHATS_NEW_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    const items = await parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: WA_DOR_WHATS_NEW_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
    if (items.length > 0) return items
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: WA_DOR_WHATS_NEW_URL,
        title: 'WA DOR what is new update',
        html: snapshot.body,
      }),
    ]
  },
}

export const maDorPressAdapter: SourceAdapter = {
  id: 'ma.dor.press',
  tier: 'T1',
  cronIntervalMs: 120 * 60 * 1000,
  jurisdiction: 'MA',
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: MA_DOR_PRESS_URL })]
  },
  async parse(snapshot, ctx) {
    if (snapshot.notModified) return []
    const items = await parsedItemsFromLinks({
      sourceId: this.id,
      baseUrl: MA_DOR_PRESS_URL,
      html: snapshot.body,
      ctx,
      limit: 12,
    })
    if (items.length > 0) return items
    return [
      parsedItemFromHtml({
        sourceId: this.id,
        sourceUrl: MA_DOR_PRESS_URL,
        title: 'MA DOR press update',
        html: snapshot.body,
      }),
    ]
  },
}

function isFemaFeature(value: unknown): value is {
  attributes: Record<string, unknown>
} {
  if (typeof value !== 'object' || value === null || !('attributes' in value)) return false
  const attributes = value.attributes
  return typeof attributes === 'object' && attributes !== null
}

function femaFeaturesFromParsed(parsed: unknown): unknown[] {
  if (typeof parsed !== 'object' || parsed === null || !('features' in parsed)) return []
  return Array.isArray(parsed.features) ? parsed.features : []
}

function femaDate(value: unknown): Date {
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date()
}

export const femaDeclarationsAdapter: SourceAdapter = {
  id: 'fema.declarations',
  tier: 'T2',
  cronIntervalMs: 30 * 60 * 1000,
  jurisdiction: 'federal',
  canCreatePulse: false,
  async fetch(ctx) {
    return [await fetchTextSnapshot(ctx, { sourceId: this.id, url: FEMA_API_URL })]
  },
  async parse(snapshot) {
    if (snapshot.notModified) return []
    let parsed: unknown
    try {
      parsed = JSON.parse(snapshot.body)
    } catch {
      return []
    }
    const features = femaFeaturesFromParsed(parsed)
    return features
      .filter(isFemaFeature)
      .slice(0, 20)
      .map((feature) => {
        const attrs = feature.attributes
        const state = typeof attrs.state === 'string' ? attrs.state : 'US'
        const area =
          typeof attrs.designatedArea === 'string' ? attrs.designatedArea : 'affected area'
        const title =
          typeof attrs.declarationTitle === 'string'
            ? attrs.declarationTitle
            : `${state} FEMA disaster declaration`
        const disasterNumber =
          typeof attrs.disasterNumber === 'number' || typeof attrs.disasterNumber === 'string'
            ? String(attrs.disasterNumber)
            : stableExternalId(FEMA_DECLARATIONS_URL)
        const incidentType = typeof attrs.incidentType === 'string' ? attrs.incidentType : 'unknown'
        const publishedAt = femaDate(attrs.declarationDate)
        return {
          sourceId: this.id,
          externalId: `fema-${disasterNumber}`,
          title,
          publishedAt,
          officialSourceUrl: FEMA_DECLARATIONS_URL,
          jurisdiction: state,
          rawText: textExcerpt(
            [
              title,
              `State: ${state}`,
              `Designated area: ${area}`,
              `Incident type: ${incidentType}`,
              `Declaration date: ${publishedAt.toISOString().slice(0, 10)}`,
              `Incident begin date: ${femaDate(attrs.incidentBeginDate).toISOString().slice(0, 10)}`,
            ].join('\n'),
          ),
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
    if (snapshot.notModified) return []
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

export const livePulseAdapters = [
  irsDisasterAdapter,
  irsNewsroomAdapter,
  irsGuidanceAdapter,
  caFtbNewsroomAdapter,
  caFtbTaxNewsAdapter,
  caCdtfaNewsAdapter,
  nyDtfPressAdapter,
  txComptrollerRssAdapter,
  flDorTipsAdapter,
  waDorNewsAdapter,
  waDorWhatsNewAdapter,
  maDorPressAdapter,
  femaDeclarationsAdapter,
] as const

export const phase0PulseAdapters = livePulseAdapters
