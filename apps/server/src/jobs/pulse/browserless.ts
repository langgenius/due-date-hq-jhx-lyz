import type { IngestFetch } from '@duedatehq/ingest'

export interface BrowserlessConfig {
  endpoint?: string | undefined
  token?: string | undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function serializableHeaders(headers: RequestInit['headers']): HeadersInit | undefined {
  if (!headers) return undefined
  if (headers instanceof Headers) return Object.fromEntries(headers.entries())
  return headers
}

function responseFromBrowserlessPayload(payload: unknown): Response | null {
  if (!isRecord(payload)) return null
  const html = typeof payload.html === 'string' ? payload.html : null
  const text = typeof payload.text === 'string' ? payload.text : null
  const body = html ?? text
  if (!body) return null
  return new Response(body, {
    headers: {
      'content-type': html ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
    },
  })
}

export function createBrowserlessFetch(config: BrowserlessConfig): IngestFetch | null {
  if (!config.endpoint) return null

  return async (input, init) => {
    const targetUrl = input instanceof URL ? input.toString() : input
    const response = await fetch(config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
      body: JSON.stringify({
        url: targetUrl,
        method: init?.method ?? 'GET',
        headers: serializableHeaders(init?.headers),
        body: typeof init?.body === 'string' ? init.body : undefined,
      }),
    })
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const parsed: unknown = await response.json()
      return (
        responseFromBrowserlessPayload(parsed) ?? Response.json(parsed, { status: response.status })
      )
    }
    return response
  }
}
