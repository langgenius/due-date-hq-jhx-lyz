import { useQuery } from '@tanstack/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon } from 'lucide-react'

import type { PulseAlertPublic, PulseSourceHealth } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'

import { rpcErrorMessage } from '@/lib/rpc-error'

import { usePulseDrawer } from './DrawerProvider'
import { usePulseListHistoryQueryOptions, usePulseSourceHealthQueryOptions } from './api'
import { PulseAlertCard } from './components/PulseAlertCard'
import { PulsingDot } from './components/PulsingDot'

// `/alerts` route — Pulse history timeline. Uses the same hairline / mono
// language as the dashboard strip; no oversized cards, no chrome shadows.
export function AlertsListPage() {
  const { t } = useLingui()
  const { openDrawer } = usePulseDrawer()
  const alertsQuery = useQuery(usePulseListHistoryQueryOptions(50))
  const sourceHealthQuery = useQuery(usePulseSourceHealthQueryOptions())
  const alerts = alertsQuery.data?.alerts ?? []
  const sourceHealth = sourceHealthQuery.data?.sources ?? []
  const isEmpty = !alertsQuery.isLoading && alerts.length === 0
  const breathingAlertId = alerts.find(isBreathingAlertRow)?.id

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
                due-date changes, snooze, or revisit closed alerts.
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
        <SkeletonList sources={sourceHealth} />
      ) : isEmpty ? (
        <EmptyState sources={sourceHealth} />
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <PulseAlertCard
              key={alert.id}
              alert={alert}
              breathing={alert.id === breathingAlertId}
              onReview={() => openDrawer(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function isBreathingAlertRow(alert: PulseAlertPublic): boolean {
  return alert.status === 'matched' && alert.matchedCount + alert.needsReviewCount > 0
}

// Loading shimmer that matches the heartbeat language: warning-tone pulsing
// dot on the lead row, then two ghost rows with mono shimmer bars. No solid
// gray blocks — the page should look like it's listening, not waiting.
function sourceLabel(sources: readonly PulseSourceHealth[]): string {
  const enabled = sources.filter((source) => source.enabled && source.healthStatus !== 'paused')
  if (enabled.length === 0) return 'configured Pulse sources'
  return enabled
    .map((source) => {
      if (source.sourceId === 'irs.disaster') return 'IRS'
      if (source.sourceId === 'ca.ftb.newsroom' || source.sourceId === 'ca.ftb.tax_news') {
        return 'CA FTB'
      }
      if (source.sourceId === 'tx.cpa.rss') return 'TX'
      if (source.sourceId === 'fema.declarations') return 'FEMA'
      return source.label
    })
    .filter((label, index, labels) => labels.indexOf(label) === index)
    .join(' + ')
}

function SkeletonList({ sources }: { sources: readonly PulseSourceHealth[] }) {
  const label = sourceLabel(sources)
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2">
      <span className="sr-only">
        <Trans>Loading alerts…</Trans>
      </span>
      <SkeletonRow tone="warning" active label={<Trans>Checking {label}…</Trans>} />
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

function EmptyState({ sources }: { sources: readonly PulseSourceHealth[] }) {
  const label = sourceLabel(sources)
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-divider-regular bg-background-default px-4 py-5 text-md text-text-secondary">
      <PulsingDot tone="success" active />
      <span className="flex-1">
        <Trans>All clear. We're watching {label}; new matches will appear here.</Trans>
      </span>
    </div>
  )
}
