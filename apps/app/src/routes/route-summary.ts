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
  alerts: { eyebrow: msg`Operations`, title: msg`Alerts` },
  clients: { eyebrow: msg`Admin`, title: msg`Clients` },
  audit: { eyebrow: msg`Admin`, title: msg`Audit log` },
  settingsProfile: { eyebrow: msg`Settings`, title: msg`Profile` },
  settingsMembers: { eyebrow: msg`Settings`, title: msg`Members` },
  settingsRules: { eyebrow: msg`Settings`, title: msg`Rules` },
  settingsBilling: { eyebrow: msg`Settings`, title: msg`Billing` },
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
