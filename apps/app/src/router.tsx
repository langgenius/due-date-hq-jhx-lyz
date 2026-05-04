import {
  createBrowserRouter,
  Outlet,
  redirect,
  replace,
  type LoaderFunctionArgs,
} from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'

import { activateLocale } from '@/i18n/i18n'
import { persistLocaleHandoffFromUrl } from '@/i18n/locales'
import { authClient } from '@/lib/auth'
import { removeLocaleFromPath } from '@/i18n/query'
import { EntryShell } from '@/routes/_entry-layout'
import { RootLayout, ShellSkeleton } from '@/routes/_layout'
import { RouteErrorBoundary } from '@/routes/error'
import { EntryRouteHydrateFallback, RouteHydrateFallback } from '@/routes/fallback'
import { routeHandle, routeSummaries } from '@/routes/route-summary'
import { RouteDocumentTitle } from '@/routes/route-title'

// Route id used by children to reach into the layout loader via useRouteLoaderData.
export const PROTECTED_ROUTE_ID = 'protected'

type MfaSessionShape = {
  user?: unknown
  session?: unknown
}

async function fetchSession({ request }: LoaderFunctionArgs) {
  const { data } = await authClient.getSession({
    fetchOptions: { signal: request.signal },
  })
  return data
}

function booleanField(value: unknown, key: string): boolean | undefined {
  if (!value || typeof value !== 'object' || !(key in value)) return undefined
  const field = Reflect.get(value, key)
  return typeof field === 'boolean' ? field : undefined
}

function needsTwoFactorVerification(session: MfaSessionShape): boolean {
  return (
    booleanField(session.user, 'twoFactorEnabled') === true &&
    booleanField(session.session, 'twoFactorVerified') !== true
  )
}

/**
 * Open-redirect guard reused by both /login and /onboarding loaders.
 * Only allow in-app paths (no protocol, no `//host` schemes).
 */
function pickSafeRedirect(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

function applyRequestLocaleHandoff(url: URL): boolean {
  const locale = persistLocaleHandoffFromUrl(url)
  if (!locale) return false

  activateLocale(locale, { persist: false })
  return true
}

function pathAndQueryWithoutLocale(url: URL): string {
  return removeLocaleFromPath(`${url.pathname}${url.search}${url.hash}`)
}

function AppRoot() {
  return (
    <NuqsAdapter>
      <RouteDocumentTitle />
      <Outlet />
    </NuqsAdapter>
  )
}

function notFoundLoader() {
  throw new Response('Page not found', { status: 404, statusText: 'Not Found' })
}

function dashboardAliasLoader() {
  throw redirect('/')
}

function importsAliasLoader() {
  throw redirect('/clients?importHistory=open')
}

function calendarAliasLoader() {
  throw redirect('/workboard/calendar')
}

// Only reachable when unauthenticated. If the session resolves, bounce to the
// post-login target (honouring ?redirectTo=... but only for in-app paths).
async function guestLoader(args: LoaderFunctionArgs) {
  const session = await fetchSession(args)
  const url = new URL(args.request.url)
  const consumedLocale = applyRequestLocaleHandoff(url)
  if (session) {
    throw redirect(pickSafeRedirect(url.searchParams.get('redirectTo')))
  }
  if (consumedLocale) throw replace(pathAndQueryWithoutLocale(url))
  return null
}

// Reachable only with a valid session that has NO active organization yet —
// this is the first-login firm onboarding gate. Sessions with an active org
// bounce straight to the post-login target.
async function onboardingLoader(args: LoaderFunctionArgs) {
  const session = await fetchSession(args)
  const url = new URL(args.request.url)
  const consumedLocale = applyRequestLocaleHandoff(url)
  if (!session) throw redirect('/login?redirectTo=/onboarding')
  if (session.session.activeOrganizationId) {
    throw redirect(pickSafeRedirect(url.searchParams.get('redirectTo')))
  }
  if (consumedLocale) throw replace(pathAndQueryWithoutLocale(url))
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
  const url = new URL(args.request.url)
  const consumedLocale = applyRequestLocaleHandoff(url)
  if (!session) {
    const pathAndQuery = pathAndQueryWithoutLocale(url)
    const param =
      pathAndQuery && pathAndQuery !== '/' ? `?redirectTo=${encodeURIComponent(pathAndQuery)}` : ''
    throw redirect(`/login${param}`)
  }
  // No active firm yet → first-login onboarding. Skip the redirect when we're
  // already on /onboarding to avoid a loop (defensive — /onboarding is not a
  // child of this loader, but the check is cheap).
  if (!session.session.activeOrganizationId) {
    const pathAndQuery = pathAndQueryWithoutLocale(url)
    const param =
      pathAndQuery && pathAndQuery !== '/onboarding'
        ? `?redirectTo=${encodeURIComponent(pathAndQuery)}`
        : ''
    throw redirect(`/onboarding${param}`)
  }
  if (needsTwoFactorVerification(session)) {
    const pathAndQuery = pathAndQueryWithoutLocale(url)
    const param =
      pathAndQuery && pathAndQuery !== '/' ? `?redirectTo=${encodeURIComponent(pathAndQuery)}` : ''
    throw redirect(`/two-factor${param}`)
  }
  if (consumedLocale) throw replace(pathAndQueryWithoutLocale(url))
  return { user: session.user }
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      Component: AppRoot,
      ErrorBoundary: RouteErrorBoundary,
      children: [
        {
          // Pathless layout route — renders the shared "entry" chrome
          // (header / footer / locale switcher) once for every page users
          // see *before* reaching the dashboard shell: `/login` (pre-auth)
          // and `/onboarding` (post-auth, pre-active-org). Each child runs
          // its own loader independently. See `docs/dev-log/
          // 2026-04-26-entry-shell-extraction.md` for the naming rationale.
          Component: EntryShell,
          children: [
            {
              path: '/login',
              loader: guestLoader,
              handle: routeHandle(routeSummaries.login),
              HydrateFallback: EntryRouteHydrateFallback,
              lazy: async () => {
                const { LoginRoute } = await import('@/routes/login')

                return { Component: LoginRoute }
              },
            },
            {
              path: '/two-factor',
              handle: routeHandle(routeSummaries.twoFactor),
              HydrateFallback: EntryRouteHydrateFallback,
              lazy: async () => {
                const { TwoFactorRoute } = await import('@/routes/two-factor')

                return { Component: TwoFactorRoute }
              },
            },
            {
              path: '/accept-invite',
              handle: routeHandle(routeSummaries.acceptInvite),
              HydrateFallback: EntryRouteHydrateFallback,
              lazy: async () => {
                const { AcceptInviteRoute } = await import('@/routes/accept-invite')

                return { Component: AcceptInviteRoute }
              },
            },
            {
              path: '/onboarding',
              loader: onboardingLoader,
              handle: routeHandle(routeSummaries.onboarding),
              HydrateFallback: EntryRouteHydrateFallback,
              lazy: async () => {
                const { OnboardingRoute } = await import('@/routes/onboarding')

                return { Component: OnboardingRoute }
              },
            },
            {
              path: '/readiness/:token',
              HydrateFallback: EntryRouteHydrateFallback,
              lazy: async () => {
                const { ReadinessPortalRoute } = await import('@/routes/readiness')

                return { Component: ReadinessPortalRoute }
              },
            },
          ],
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
          children: [
            {
              index: true,
              handle: routeHandle(routeSummaries.dashboard),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { DashboardRoute } = await import('@/routes/dashboard')

                return { Component: DashboardRoute }
              },
            },
            {
              path: 'dashboard',
              loader: dashboardAliasLoader,
              HydrateFallback: RouteHydrateFallback,
            },
            {
              path: 'workboard',
              handle: routeHandle(routeSummaries.workboard),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { WorkboardRoute } = await import('@/routes/workboard')

                return { Component: WorkboardRoute }
              },
            },
            {
              path: 'workboard/calendar',
              handle: routeHandle(routeSummaries.calendarSync),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { CalendarRoute } = await import('@/routes/calendar')

                return { Component: CalendarRoute }
              },
            },
            {
              path: 'calendar',
              loader: calendarAliasLoader,
              HydrateFallback: RouteHydrateFallback,
            },
            {
              path: 'workload',
              handle: routeHandle(routeSummaries.workload),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { WorkloadRoute } = await import('@/routes/workload')

                return { Component: WorkloadRoute }
              },
            },
            {
              path: 'alerts',
              handle: routeHandle(routeSummaries.alerts),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { AlertsRoute } = await import('@/routes/alerts')

                return { Component: AlertsRoute }
              },
            },
            {
              path: 'notifications',
              handle: routeHandle(routeSummaries.notifications),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { NotificationsRoute } = await import('@/routes/notifications')

                return { Component: NotificationsRoute }
              },
            },
            {
              path: 'clients',
              handle: routeHandle(routeSummaries.clients),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { ClientsRoute } = await import('@/routes/clients')

                return { Component: ClientsRoute }
              },
            },
            {
              path: 'imports',
              HydrateFallback: RouteHydrateFallback,
              loader: importsAliasLoader,
            },
            {
              path: 'audit',
              handle: routeHandle(routeSummaries.audit),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { AuditRoute } = await import('@/routes/audit')

                return { Component: AuditRoute }
              },
            },
            {
              path: 'rules',
              handle: routeHandle(routeSummaries.rules),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { RulesRoute } = await import('@/routes/rules')

                return { Component: RulesRoute }
              },
            },
            {
              path: 'practice',
              handle: routeHandle(routeSummaries.practice),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { PracticeRoute } = await import('@/routes/practice')

                return { Component: PracticeRoute }
              },
            },
            {
              path: 'members',
              handle: routeHandle(routeSummaries.members),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { MembersRoute } = await import('@/routes/members')

                return { Component: MembersRoute }
              },
            },
            {
              path: 'account/security',
              handle: routeHandle(routeSummaries.accountSecurity),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { AccountSecurityRoute } = await import('@/routes/account.security')

                return { Component: AccountSecurityRoute }
              },
            },
            {
              path: 'billing',
              handle: routeHandle(routeSummaries.billing),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { BillingRoute } = await import('@/routes/billing')

                return { Component: BillingRoute }
              },
            },
            {
              path: 'billing/checkout',
              handle: routeHandle(routeSummaries.billingCheckout),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { BillingCheckoutRoute } = await import('@/routes/billing.checkout')

                return { Component: BillingCheckoutRoute }
              },
            },
            {
              path: 'billing/success',
              handle: routeHandle(routeSummaries.billingCheckout),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { BillingSuccessRoute } = await import('@/routes/billing.success')

                return { Component: BillingSuccessRoute }
              },
            },
            {
              path: 'billing/cancel',
              handle: routeHandle(routeSummaries.billingCheckout),
              HydrateFallback: RouteHydrateFallback,
              lazy: async () => {
                const { BillingCancelRoute } = await import('@/routes/billing.cancel')

                return { Component: BillingCancelRoute }
              },
            },
          ],
        },
        {
          path: '*',
          loader: notFoundLoader,
        },
      ],
    },
  ])
}

// Exported for unit tests.
export {
  dashboardAliasLoader,
  calendarAliasLoader,
  guestLoader,
  importsAliasLoader,
  onboardingLoader,
  protectedLoader,
  pickSafeRedirect,
  notFoundLoader,
}
