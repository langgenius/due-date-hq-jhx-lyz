import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon, AlertTriangleIcon, FilterXIcon } from 'lucide-react'

import type {
  PulseAlertPublic,
  PulseFirmAlertStatus,
  PulseSourceHealth,
} from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'

import { rpcErrorMessage } from '@/lib/rpc-error'

import { usePulseDrawer } from './DrawerProvider'
import { usePulseListHistoryQueryOptions, usePulseSourceHealthQueryOptions } from './api'
import { PulseAlertCard } from './components/PulseAlertCard'
import { PulsingDot } from './components/PulsingDot'

const STATUS_FILTER_OPTIONS = [
  'all',
  'active',
  'applied',
  'partially_applied',
  'dismissed',
  'reverted',
  'snoozed',
] as const
type PulseStatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]
const EMPTY_ALERTS: readonly PulseAlertPublic[] = []
const EMPTY_SOURCES: readonly PulseSourceHealth[] = []

// `/alerts` route — Pulse history timeline. Uses the same hairline / mono
// language as the dashboard strip; no oversized cards, no chrome shadows.
export function AlertsListPage() {
  const { t } = useLingui()
  const { openDrawer } = usePulseDrawer()
  const [statusFilter, setStatusFilter] = useState<PulseStatusFilter>('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const alertsQuery = useQuery(usePulseListHistoryQueryOptions(50))
  const sourceHealthQuery = useQuery(usePulseSourceHealthQueryOptions())
  const alerts = alertsQuery.data?.alerts ?? EMPTY_ALERTS
  const sourceHealth = sourceHealthQuery.data?.sources ?? EMPTY_SOURCES
  const attentionSources = sourcesNeedingAttention(sourceHealth)
  const sourceOptions = useMemo(
    () =>
      alerts
        .map((alert) => alert.source)
        .filter((source, index, sources) => sources.indexOf(source) === index)
        .toSorted(),
    [alerts],
  )
  const filteredAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          matchesStatusFilter(alert.status, statusFilter) &&
          (sourceFilter === 'all' || alert.source === sourceFilter),
      ),
    [alerts, sourceFilter, statusFilter],
  )
  const isEmpty = !alertsQuery.isLoading && alerts.length === 0
  const isFilteredEmpty = !alertsQuery.isLoading && alerts.length > 0 && filteredAlerts.length === 0
  const breathingAlertId = filteredAlerts.find(isBreathingAlertRow)?.id
  const filtersActive = statusFilter !== 'all' || sourceFilter !== 'all'

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
                Regulatory Pulse signals that match your practice's clients. Review, batch-apply
                due-date changes, snooze, or revisit closed alerts.
              </Trans>
            </p>
          </div>
          {!alertsQuery.isLoading ? (
            <span className="hidden font-mono text-xs tabular-nums text-text-tertiary md:inline">
              {alerts.length === 0 ? (
                <Trans>0 active</Trans>
              ) : filtersActive ? (
                <Trans>
                  {filteredAlerts.length} shown · {alerts.length} total
                </Trans>
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

      {attentionSources.length > 0 ? <SourceAttentionAlert sources={attentionSources} /> : null}

      {alertsQuery.isLoading ? (
        <SkeletonList sources={sourceHealth} />
      ) : isEmpty ? (
        <EmptyState sources={sourceHealth} />
      ) : (
        <>
          <div className="flex flex-col gap-2 rounded-md border border-divider-subtle bg-background-default p-3 md:flex-row md:items-center md:justify-between">
            <div className="grid gap-2 md:grid-cols-[180px_minmax(220px,320px)]">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (typeof value === 'string' && isStatusFilter(value)) setStatusFilter(value)
                }}
              >
                <SelectTrigger className="w-full" size="sm" aria-label={t`Filter by alert status`}>
                  <SelectValue>{statusFilterLabel(statusFilter)}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {statusFilterLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sourceFilter}
                onValueChange={(value) => {
                  if (typeof value === 'string') setSourceFilter(value)
                }}
              >
                <SelectTrigger className="w-full" size="sm" aria-label={t`Filter by source`}>
                  <SelectValue>
                    {sourceFilter === 'all' ? <Trans>All sources</Trans> : sourceFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="all">
                    <Trans>All sources</Trans>
                  </SelectItem>
                  {sourceOptions.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!filtersActive}
              onClick={() => {
                setStatusFilter('all')
                setSourceFilter('all')
              }}
            >
              <FilterXIcon data-icon="inline-start" />
              <Trans>Reset</Trans>
            </Button>
          </div>

          {isFilteredEmpty ? (
            <FilteredEmptyState />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredAlerts.map((alert) => (
                <PulseAlertCard
                  key={alert.id}
                  alert={alert}
                  breathing={alert.id === breathingAlertId}
                  onReview={() => openDrawer(alert.id)}
                />
              ))}
            </div>
          )}
        </>
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
      if (source.sourceId.startsWith('irs.')) return 'IRS'
      if (source.sourceId.startsWith('ca.ftb.')) return 'CA FTB'
      if (source.sourceId.startsWith('ca.cdtfa.')) return 'CA CDTFA'
      if (source.sourceId === 'ny.dtf.press') return 'NY'
      if (source.sourceId === 'tx.cpa.rss') return 'TX'
      if (source.sourceId === 'fl.dor.tips') return 'FL'
      if (source.sourceId.startsWith('wa.dor.')) return 'WA'
      if (source.sourceId === 'ma.dor.press') return 'MA'
      if (source.sourceId === 'fema.declarations') return 'FEMA'
      return source.label
    })
    .filter((label, index, labels) => labels.indexOf(label) === index)
    .join(' + ')
}

function SourceAttentionAlert({ sources }: { sources: readonly PulseSourceHealth[] }) {
  const label = sourceLabel(sources)
  return (
    <Alert variant="warning">
      <AlertTriangleIcon />
      <AlertTitle>
        <Trans>Pulse source needs attention</Trans>
      </AlertTitle>
      <AlertDescription>
        <Trans>
          {label} returned degraded or failing health on the latest checked run. Existing alerts
          remain reviewable.
        </Trans>
      </AlertDescription>
    </Alert>
  )
}

function FilteredEmptyState() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-divider-regular bg-background-default px-4 py-5 text-md text-text-secondary">
      <PulsingDot tone="disabled" />
      <span className="flex-1">
        <Trans>No alerts match these filters.</Trans>
      </span>
    </div>
  )
}

function isStatusFilter(value: string): value is PulseStatusFilter {
  return STATUS_FILTER_OPTIONS.some((option) => option === value)
}

function matchesStatusFilter(status: PulseFirmAlertStatus, filter: PulseStatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return status === 'matched'
  return status === filter
}

function statusFilterLabel(filter: PulseStatusFilter): React.ReactNode {
  if (filter === 'all') return <Trans>All statuses</Trans>
  if (filter === 'active') return <Trans>Active</Trans>
  if (filter === 'partially_applied') return <Trans>Partially applied</Trans>
  if (filter === 'applied') return <Trans>Applied</Trans>
  if (filter === 'dismissed') return <Trans>Dismissed</Trans>
  if (filter === 'reverted') return <Trans>Reverted</Trans>
  return <Trans>Snoozed</Trans>
}

function sourcesNeedingAttention(sources: readonly PulseSourceHealth[]): PulseSourceHealth[] {
  return sources.filter(
    (source) =>
      source.enabled &&
      source.lastCheckedAt !== null &&
      (source.healthStatus === 'degraded' || source.healthStatus === 'failing'),
  )
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
