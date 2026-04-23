import { createAuthClient } from 'better-auth/react'

// Single better-auth client for the SPA. Phase 0 wires organizationClient + magicLinkClient plugins.
export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/api/auth`,
})
