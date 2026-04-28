import { useQuery } from '@tanstack/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'

import { rpcErrorMessage } from '@/lib/rpc-error'

import { usePulseDrawer } from './DrawerProvider'
import { usePulseListAlertsQueryOptions } from './api'
import { PulseAlertCard } from './components/PulseAlertCard'
import { PulsingDot } from './components/PulsingDot'

// `/alerts` route — Pulse history timeline. Uses the same hairline / mono
// language as the dashboard strip; no oversized cards, no chrome shadows.
export function AlertsListPage() {
  const { t } = useLingui()
  const { openDrawer } = usePulseDrawer()
  const alertsQuery = useQuery(usePulseListAlertsQueryOptions(20))
  const alerts = alertsQuery.data?.alerts ?? []
  const isEmpty = !alertsQuery.isLoading && alerts.length === 0

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Trans>Operations</Trans>
        </span>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold leading-tight text-text-primary">
              <PulsingDot tone={isEmpty ? 'success' : 'warning'} active />
              <Trans>Alerts</Trans>
            </h1>
            <p className="max-w-[640px] text-md text-text-secondary">
              <Trans>
                Regulatory Pulse signals that match your firm's clients. Review, batch-apply
                due-date changes, or dismiss to keep the queue clean.
              </Trans>
            </p>
          </div>
          {!alertsQuery.isLoading ? (
            <span className="hidden font-mono text-xs tabular-nums text-text-tertiary md:inline">
              {alerts.length === 0 ? (
                <Trans>0 active</Trans>
              ) : (
                <Plural value={alerts.length} one="# active" other="# active" />
              )}
            </span>
          ) : null}
        </div>
      </header>

      {alertsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Couldn't load alerts</Trans>
          </AlertTitle>
          <AlertDescription>
            {rpcErrorMessage(alertsQuery.error) ?? t`Please try again.`}{' '}
            <button type="button" className="underline" onClick={() => void alertsQuery.refetch()}>
              <Trans>Retry</Trans>
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {alertsQuery.isLoading ? (
        <SkeletonList />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <PulseAlertCard key={alert.id} alert={alert} onReview={() => openDrawer(alert.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// Loading shimmer that matches the heartbeat language: warning-tone pulsing
// dot on the lead row, then two ghost rows with mono shimmer bars. No solid
// gray blocks — the page should look like it's listening, not waiting.
function SkeletonList() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2">
      <span className="sr-only">
        <Trans>Loading alerts…</Trans>
      </span>
      <SkeletonRow tone="warning" active label={<Trans>Checking IRS + state sources…</Trans>} />
      <SkeletonRow tone="disabled" />
      <SkeletonRow tone="disabled" />
    </div>
  )
}

function SkeletonRow({
  tone,
  active = false,
  label,
}: {
  tone: 'warning' | 'disabled'
  active?: boolean
  label?: React.ReactNode
}) {
  return (
    <div
      data-skeleton="alert"
      className="flex h-14 items-center gap-3 rounded-md border border-divider-subtle bg-background-default px-3"
    >
      <PulsingDot tone={tone} active={active} />
      {label ? (
        <span className="text-md text-text-tertiary">{label}</span>
      ) : (
        <>
          <span
            aria-hidden
            className="h-2 w-24 animate-pulse rounded-full bg-state-base-hover-alt motion-reduce:animate-none"
          />
          <span aria-hidden className="text-text-tertiary">
            ·
          </span>
          <span
            aria-hidden
            className="h-2 max-w-[280px] flex-1 animate-pulse rounded-full bg-state-base-hover-alt motion-reduce:animate-none"
          />
          <span
            aria-hidden
            className="ml-auto h-2 w-12 animate-pulse rounded-full bg-state-base-hover-alt motion-reduce:animate-none"
          />
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-divider-regular bg-background-default px-4 py-5 text-md text-text-secondary">
      <PulsingDot tone="success" active />
      <span className="flex-1">
        <Trans>
          All clear. We're watching IRS + CA / NY / TX / FL / WA — new signals will appear here as
          soon as they match your clients.
        </Trans>
      </span>
    </div>
  )
}
