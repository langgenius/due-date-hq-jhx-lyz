export interface CalendarTokenPayload {
  subscriptionId: string
  nonce: string
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function hmacSignature(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return bytesToBase64Url(new Uint8Array(signature))
}

export async function signCalendarToken(input: {
  secret: string
  subscriptionId: string
  nonce: string
}): Promise<string> {
  const payload = bytesToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        subscriptionId: input.subscriptionId,
        nonce: input.nonce,
      } satisfies CalendarTokenPayload),
    ),
  )
  const signature = await hmacSignature(input.secret, payload)
  return `${payload}.${signature}`
}

export async function verifyCalendarToken(input: {
  secret: string
  token: string
}): Promise<CalendarTokenPayload | null> {
  const [payloadPart, signaturePart, extra] = input.token.split('.')
  if (!payloadPart || !signaturePart || extra !== undefined) return null
  const expected = await hmacSignature(input.secret, payloadPart)
  if (signaturePart !== expected) return null

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart)))
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.subscriptionId !== 'string' ||
      typeof payload.nonce !== 'string' ||
      payload.subscriptionId.length === 0 ||
      payload.nonce.length === 0
    ) {
      return null
    }
    return { subscriptionId: payload.subscriptionId, nonce: payload.nonce }
  } catch {
    return null
  }
}

export function calendarFeedUrl(feedBaseUrl: string, token: string): string {
  const baseUrl = feedBaseUrl.replace(/\/+$/, '')
  return `${baseUrl}/api/ics/${encodeURIComponent(token)}.ics`
}
