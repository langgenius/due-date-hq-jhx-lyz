export interface ParsedDocument {
  querySelectorAll(selector: string): readonly unknown[]
}

export function pickSelector(doc: ParsedDocument, chain: readonly string[]): string | null {
  for (const selector of chain) {
    if (doc.querySelectorAll(selector).length > 0) return selector
  }
  return null
}

export function extractLinks(html: string, baseUrl: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = []
  const re = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi
  for (const match of html.matchAll(re)) {
    const href = match[2]
    const text = stripHtml(match[3] ?? '')
    if (!href || !text) continue
    try {
      links.push({ href: new URL(href, baseUrl).toString(), text })
    } catch {
      // Ignore malformed source links.
    }
  }
  return links
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
