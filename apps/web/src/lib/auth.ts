import { createAuthClient } from 'better-auth/react'

// Single better-auth client for the SPA. Google OAuth is the primary sign-in path.
export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/api/auth`,
})

export function signInWithGoogle() {
  return authClient.signIn.social({
    provider: 'google',
    callbackURL: '/',
  })
}
