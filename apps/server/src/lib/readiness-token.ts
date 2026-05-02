export interface ReadinessPortalTokenPayload {
  requestId: string
  exp: number
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

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function signReadinessPortalToken(input: {
  secret: string
  requestId: string
  expiresAtMs: number
}): Promise<string> {
  const payload = bytesToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        requestId: input.requestId,
        exp: input.expiresAtMs,
      } satisfies ReadinessPortalTokenPayload),
    ),
  )
  const signature = await hmacSignature(input.secret, payload)
  return `${payload}.${signature}`
}

export async function verifyReadinessPortalToken(input: {
  secret: string
  token: string
  nowMs?: number
}): Promise<ReadinessPortalTokenPayload | null> {
  const [payloadPart, signaturePart, extra] = input.token.split('.')
  if (!payloadPart || !signaturePart || extra !== undefined) return null
  const expected = await hmacSignature(input.secret, payloadPart)
  if (signaturePart !== expected) return null

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart)))
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.requestId !== 'string' ||
      typeof payload.exp !== 'number' ||
      !Number.isSafeInteger(payload.exp)
    ) {
      return null
    }
    if (payload.exp <= (input.nowMs ?? Date.now())) return null
    return { requestId: payload.requestId, exp: payload.exp }
  } catch {
    return null
  }
}
