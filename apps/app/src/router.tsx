import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router'

import { authClient } from '@/lib/auth'
import { RootLayout, ShellSkeleton } from '@/routes/_layout'
import { RouteErrorBoundary } from '@/routes/error'
import { RouteHydrateFallback } from '@/routes/fallback'

// Route id used by children to reach into the layout loader via useRouteLoaderData.
export const PROTECTED_ROUTE_ID = 'protected'

async function fetchSession({ request }: LoaderFunctionArgs) {
  const { data } = await authClient.getSession({
    fetchOptions: { signal: request.signal },
  })
  return data
}

/**
 * Open-redirect guard reused by both /login and /onboarding loaders.
 * Only allow in-app paths (no protocol, no `//host` schemes).
 */
function pickSafeRedirect(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

// Only reachable when unauthenticated. If the session resolves, bounce to the
// post-login target (honouring ?redirectTo=... but only for in-app paths).
async function guestLoader(args: LoaderFunctionArgs) {
  const session = await fetchSession(args)
  if (session) {
    const url = new URL(args.request.url)
    throw redirect(pickSafeRedirect(url.searchParams.get('redirectTo')))
  }
  return null
}

// Reachable only with a valid session that has NO active organization yet —
// this is the first-login firm onboarding gate. Sessions with an active org
// bounce straight to the post-login target.
async function onboardingLoader(args: LoaderFunctionArgs) {
  const session = await fetchSession(args)
  if (!session) throw redirect('/login?redirectTo=/onboarding')
  if (session.session.activeOrganizationId) {
    const url = new URL(args.request.url)
    throw redirect(pickSafeRedirect(url.searchParams.get('redirectTo')))
  }
  // Note: derivePracticeName needs an i18n-localized fallback ("My Practice" /
  // "我的事务所"). Loaders run outside the React tree so they don't have an
  // i18n context — the onboarding component computes the default itself.
  return { user: session.user }
}

// Gate for every authenticated surface. Children read the user via
// useRouteLoaderData(PROTECTED_ROUTE_ID) — never via a separate useSession call,
// so session changes can't trigger a mid-render <Navigate>.
async function protectedLoader(args: LoaderFunctionArgs) {
  const session = await fetchSession(args)
  if (!session) {
    const url = new URL(args.request.url)
    const pathAndQuery = `${url.pathname}${url.search}`
    const param =
      pathAndQuery && pathAndQuery !== '/' ? `?redirectTo=${encodeURIComponent(pathAndQuery)}` : ''
    throw redirect(`/login${param}`)
  }
  // No active firm yet → first-login onboarding. Skip the redirect when we're
  // already on /onboarding to avoid a loop (defensive — /onboarding is not a
  // child of this loader, but the check is cheap).
  if (!session.session.activeOrganizationId) {
    const url = new URL(args.request.url)
    const pathAndQuery = `${url.pathname}${url.search}`
    const param =
      pathAndQuery && pathAndQuery !== '/onboarding'
        ? `?redirectTo=${encodeURIComponent(pathAndQuery)}`
        : ''
    throw redirect(`/onboarding${param}`)
  }
  return { user: session.user }
}

export const router = createBrowserRouter([
  {
    path: '/login',
    loader: guestLoader,
    HydrateFallback: RouteHydrateFallback,
    ErrorBoundary: RouteErrorBoundary,
    lazy: async () => {
      const { LoginRoute } = await import('@/routes/login')

      return { Component: LoginRoute }
    },
  },
  {
    path: '/onboarding',
    loader: onboardingLoader,
    HydrateFallback: RouteHydrateFallback,
    ErrorBoundary: RouteErrorBoundary,
    lazy: async () => {
      const { OnboardingRoute } = await import('@/routes/onboarding')

      return { Component: OnboardingRoute }
    },
  },
  {
    id: PROTECTED_ROUTE_ID,
    path: '/',
    loader: protectedLoader,
    // Re-fetching the session on every intra-shell navigation is wasteful — the
    // Worker auth endpoint is cookie-scoped and we already revalidate after
    // form actions via the default behaviour.
    shouldRevalidate: ({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }) => {
      if (formMethod && formMethod !== 'GET') return true
      if (currentUrl.pathname === nextUrl.pathname) return defaultShouldRevalidate
      return false
    },
    Component: RootLayout,
    HydrateFallback: ShellSkeleton,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        index: true,
        HydrateFallback: RouteHydrateFallback,
        lazy: async () => {
          const { DashboardRoute } = await import('@/routes/dashboard')

          return { Component: DashboardRoute }
        },
      },
      {
        path: 'workboard',
        HydrateFallback: RouteHydrateFallback,
        lazy: async () => {
          const { WorkboardRoute } = await import('@/routes/workboard')

          return { Component: WorkboardRoute }
        },
      },
      {
        path: 'migration/new',
        HydrateFallback: RouteHydrateFallback,
        lazy: async () => {
          const { MigrationNewRoute } = await import('@/routes/migration.new')

          return { Component: MigrationNewRoute }
        },
      },
      {
        path: 'settings',
        HydrateFallback: RouteHydrateFallback,
        lazy: async () => {
          const { SettingsRoute } = await import('@/routes/settings')

          return { Component: SettingsRoute }
        },
      },
    ],
  },
])

// Exported for unit tests.
export { guestLoader, onboardingLoader, protectedLoader, pickSafeRedirect }
