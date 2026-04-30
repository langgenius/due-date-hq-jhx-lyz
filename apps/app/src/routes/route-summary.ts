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
  onboarding: { eyebrow: msg`Entry`, title: msg`Create practice` },
  dashboard: { eyebrow: msg`Operations`, title: msg`Dashboard` },
  workboard: { eyebrow: msg`Workbench`, title: msg`Workboard` },
  workload: { eyebrow: msg`Operations`, title: msg`Team workload` },
  alerts: { eyebrow: msg`Operations`, title: msg`Alerts` },
  opsPulse: { eyebrow: msg`Internal operations`, title: msg`Pulse Ops` },
  clients: { eyebrow: msg`Clients`, title: msg`Clients` },
  audit: { eyebrow: msg`Organization`, title: msg`Audit log` },
  firm: { eyebrow: msg`Organization`, title: msg`Firm profile` },
  members: { eyebrow: msg`Organization`, title: msg`Members` },
  rules: { eyebrow: msg`Organization`, title: msg`Rules` },
  billing: { eyebrow: msg`Organization`, title: msg`Billing` },
  billingCheckout: { eyebrow: msg`Billing`, title: msg`Checkout` },
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
