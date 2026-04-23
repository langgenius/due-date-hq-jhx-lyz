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

// Only reachable when unauthenticated. If the session resolves, bounce to the
// post-login target (honouring ?redirectTo=... but only for in-app paths).
async function guestLoader(args: LoaderFunctionArgs) {
  const session = await fetchSession(args)
  if (session) {
    const url = new URL(args.request.url)
    const rawTarget = url.searchParams.get('redirectTo')
    const target = rawTarget && rawTarget.startsWith('/') ? rawTarget : '/'
    throw redirect(target)
  }
  return null
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
