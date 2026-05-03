export type AuthCapabilities = {
  providers: {
    google: boolean
    microsoft: boolean
    emailOtp: boolean
  }
  publicClientIds?: {
    google?: string
  }
}

const FALLBACK_AUTH_CAPABILITIES: AuthCapabilities = {
  providers: {
    google: true,
    microsoft: false,
    emailOtp: true,
  },
}

export async function authCapabilities(): Promise<AuthCapabilities> {
  const response = await fetch('/api/auth-capabilities', { credentials: 'include' })
  if (!response.ok) return FALLBACK_AUTH_CAPABILITIES
  return response.json()
}
