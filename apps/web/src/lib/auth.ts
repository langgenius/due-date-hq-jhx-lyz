import { createAuthClient } from 'better-auth/react'

// Single better-auth client for the SPA. Google OAuth is the primary sign-in path.
// All network calls are cookie-scoped to the Worker at /api/auth (see apps/server/src/routes/auth.ts).
export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/api/auth`,
})

export const { useSession, signOut } = authClient

export type AuthSessionData = ReturnType<typeof useSession>['data']
export type AuthUser = NonNullable<AuthSessionData>['user']

export function signInWithGoogle(callbackURL = '/') {
  return authClient.signIn.social({
    provider: 'google',
    callbackURL,
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
