import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'

export const APP_DOCUMENT_TITLE = 'DueDateHQ'

export type RouteSummaryMessages = {
  eyebrow: MessageDescriptor
  title: MessageDescriptor
}

export type RouteHandle = {
  routeSummary?: RouteSummaryMessages
}

export const routeSummaries = {
  login: { eyebrow: msg`Entry`, title: msg`Sign in` },
  twoFactor: { eyebrow: msg`Entry`, title: msg`Two-factor verification` },
  acceptInvite: { eyebrow: msg`Entry`, title: msg`Accept invitation` },
  onboarding: { eyebrow: msg`Entry`, title: msg`Create practice` },
  dashboard: { eyebrow: msg`Operations`, title: msg`Dashboard` },
  workboard: { eyebrow: msg`Operations`, title: msg`Obligations` },
  calendarSync: { eyebrow: msg`Obligations`, title: msg`Calendar sync` },
  workload: { eyebrow: msg`Operations`, title: msg`Team workload` },
  alerts: { eyebrow: msg`Operations`, title: msg`Alerts` },
  notifications: { eyebrow: msg`Operations`, title: msg`Notifications` },
  opsPulse: { eyebrow: msg`Internal operations`, title: msg`Pulse Ops` },
  clients: { eyebrow: msg`Clients`, title: msg`Clients` },
  audit: { eyebrow: msg`Practice`, title: msg`Audit log` },
  practice: { eyebrow: msg`Practice`, title: msg`Practice profile` },
  members: { eyebrow: msg`Practice`, title: msg`Members` },
  rules: { eyebrow: msg`Practice`, title: msg`Rules` },
  billing: { eyebrow: msg`Practice`, title: msg`Billing` },
  billingCheckout: { eyebrow: msg`Billing`, title: msg`Checkout` },
  accountSecurity: { eyebrow: msg`Account`, title: msg`Security` },
} satisfies Record<string, RouteSummaryMessages>

export function routeHandle(routeSummary: RouteSummaryMessages): RouteHandle {
  return { routeSummary }
}

export function getRouteSummaryMessages(
  matches: readonly { handle?: unknown }[],
): RouteSummaryMessages {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const handle = matches[index]?.handle
    if (isRouteHandle(handle) && handle.routeSummary) return handle.routeSummary
  }

  return routeSummaries.dashboard
}

export function formatDocumentTitle(routeTitle: string): string {
  return routeTitle === APP_DOCUMENT_TITLE
    ? APP_DOCUMENT_TITLE
    : `${routeTitle} | ${APP_DOCUMENT_TITLE}`
}

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return !!handle && typeof handle === 'object' && 'routeSummary' in handle
}
