import { AlertsListPage } from '@/features/pulse/AlertsListPage'

// Lazy-loaded by the router. The page itself opens the shared Pulse drawer
// mounted at the layout level via `PulseDrawerProvider`.
export function AlertsRoute() {
  return <AlertsListPage />
}
