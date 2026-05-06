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

function browserlessEndpoint(config: BrowserlessConfig): string {
  const endpoint = new URL(config.endpoint!)
  if (config.token && !endpoint.searchParams.has('token')) {
    endpoint.searchParams.set('token', config.token)
  }
  return endpoint.toString()
}

function browserlessStatus(response: Response): number {
  const targetStatus = Number(response.headers.get('x-response-code'))
  if (Number.isInteger(targetStatus) && targetStatus >= 200 && targetStatus <= 599) {
    return targetStatus
  }
  return response.status
}

function responseInitFromBrowserless(response: Response, contentType: string): ResponseInit {
  const status = browserlessStatus(response)
  const headers = new Headers(response.headers)
  headers.set('content-type', contentType)
  return {
    status,
    headers,
  }
}

function responseBodyForStatus(status: number, body: string): BodyInit | null {
  return status === 204 || status === 304 ? null : body
}

function createBrowserlessResponse(
  body: string,
  response: Response,
  contentType: string,
): Response {
  const init = responseInitFromBrowserless(response, contentType)
  return new Response(responseBodyForStatus(init.status ?? response.status, body), init)
}

function responseFromBrowserlessPayload(payload: unknown, response: Response): Response | null {
  if (!isRecord(payload)) return null
  const html = typeof payload.html === 'string' ? payload.html : null
  const text = typeof payload.text === 'string' ? payload.text : null
  const body = html ?? text
  if (!body) return null
  return createBrowserlessResponse(
    body,
    response,
    html ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
  )
}

export function createBrowserlessFetch(config: BrowserlessConfig): IngestFetch | null {
  if (!config.endpoint) return null
  const endpoint = browserlessEndpoint(config)

  return async (input, init) => {
    const targetUrl = input instanceof URL ? input.toString() : input
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
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
      const parsedResponse = responseFromBrowserlessPayload(parsed, response)
      if (parsedResponse) return parsedResponse
      const status = browserlessStatus(response)
      if (status === 204 || status === 304) return new Response(null, { status })
      return Response.json(parsed, { status })
    }
    const body = await response.text()
    return createBrowserlessResponse(body, response, contentType || 'text/html')
  }
}
