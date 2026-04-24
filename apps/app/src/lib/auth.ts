import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

import { attachLocaleHeader } from '@/i18n/i18n'

// Single better-auth client for the SPA. Google OAuth is the primary sign-in path.
// All network calls are cookie-scoped to the Worker at /api/auth (see apps/server/src/routes/auth.ts).
// The x-locale header is forwarded so the Worker can localize invitation emails etc.
//
// `organizationClient()` exposes `authClient.organization.create` /
// `setActive` for the first-login onboarding flow (see routes/onboarding.tsx).
// It must mirror the server-side `organization()` plugin or the typed
// shape of `session.activeOrganizationId` will go missing.
export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/api/auth`,
  plugins: [organizationClient()],
  fetchOptions: {
    onRequest: (context) => {
      attachLocaleHeader(context.headers)
    },
  },
})

export const { useSession, signOut } = authClient

export type AuthSessionData = ReturnType<typeof useSession>['data']
export type AuthUser = NonNullable<AuthSessionData>['user']

export function signInWithGoogle(callbackURL = '/') {
  // Resolve against the CURRENT browser origin so the post-OAuth 302 lands the
  // user back where they started (e.g. Vite :5173 in dev) instead of defaulting
  // to AUTH_URL (the Worker origin, :8787). Cookies are hostname-scoped, so the
  // session resolves on either port once it is set.
  const absolute = new URL(callbackURL, window.location.origin).toString()
  return authClient.signIn.social({
    provider: 'google',
    callbackURL: absolute,
  })
}

export function initialsFromName(value: string | null | undefined): string {
  if (!value) return '?'
  const parts = value.trim().split(/\s+/).slice(0, 2)
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .padEnd(1, '?')
}
