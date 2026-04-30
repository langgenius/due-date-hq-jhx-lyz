function base64Url(bytes: ArrayBuffer): string {
  const raw = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(raw).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return base64Url(signature)
}

export async function signAuditPackageDownload(input: {
  secret: string
  packageId: string
  expiresAtMs: number
}): Promise<string> {
  return hmac(input.secret, `${input.packageId}.${input.expiresAtMs}`)
}
