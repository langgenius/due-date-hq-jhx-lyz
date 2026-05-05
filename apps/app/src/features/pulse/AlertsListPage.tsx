import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  FilterXIcon,
  LockKeyholeIcon,
} from 'lucide-react'

import type {
  PulseAlertPublic,
  PulseFirmAlertStatus,
  PulsePriorityQueueItem,
  PulseSourceHealth,
} from '@duedatehq/contracts'
import { planHasFeature } from '@duedatehq/core/plan-entitlements'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import { cn } from '@duedatehq/ui/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'

import { rpcErrorMessage } from '@/lib/rpc-error'
import { ConceptLabel } from '@/features/concepts/concept-help'
import { useCurrentFirm } from '@/features/billing/use-billing-data'

import { usePulseDrawer } from './DrawerProvider'
import {
  usePulseListHistoryQueryOptions,
  usePulsePriorityQueueQueryOptions,
  usePulseSourceHealthQueryOptions,
} from './api'
import { PulseAlertCard } from './components/PulseAlertCard'
import { PulsingDot } from './components/PulsingDot'
import {
  enabledPulseSourceCount,
  sourcesNeedingAttention,
  summarizePulseSources,
} from './lib/source-health-labels'

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
const EMPTY_PRIORITY_ITEMS: readonly PulsePriorityQueueItem[] = []
const PULSE_VIEWS = ['all', 'priority'] as const
type PulseView = (typeof PULSE_VIEWS)[number]

interface PulseChangesTabProps {
  embedded?: boolean
}

// Pulse Changes — source-backed rule-change timeline used inside Rules.
// Uses the same hairline / mono language as the dashboard strip; no oversized
// cards, no chrome shadows.
export function PulseChangesTab({ embedded = false }: PulseChangesTabProps) {
  const { t } = useLingui()
  const { openDrawer } = usePulseDrawer()
  const { currentFirm } = useCurrentFirm()
  const [statusFilter, setStatusFilter] = useState<PulseStatusFilter>('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [pulseView, setPulseView] = useState<PulseView>('all')
  const alertsQuery = useQuery(usePulseListHistoryQueryOptions(50))
  const sourceHealthQuery = useQuery(usePulseSourceHealthQueryOptions())
  const priorityEnabled = currentFirm
    ? planHasFeature(currentFirm.plan, 'priorityPulseMatching')
    : false
  const priorityQueueQuery = useQuery(
    usePulsePriorityQueueQueryOptions(50, pulseView === 'priority' && priorityEnabled),
  )
  const alerts = alertsQuery.data?.alerts ?? EMPTY_ALERTS
  const priorityItems = priorityQueueQuery.data?.items ?? EMPTY_PRIORITY_ITEMS
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
    <div className={embedded ? 'flex flex-col gap-5' : 'flex flex-col gap-5 p-4 md:p-6'}>
      {!embedded ? (
        <header className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <Trans>Practice</Trans>
          </span>
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="flex items-center gap-2 text-2xl font-semibold leading-tight text-text-primary">
                <PulsingDot tone={isEmpty ? 'success' : 'warning'} active />
                <Trans>Pulse Changes</Trans>
              </h1>
              <p className="max-w-[640px] text-md text-text-secondary">
                <ConceptLabel concept="pulse">
                  <Trans>
                    Regulatory Pulse signals that match your practice's clients. Review, batch-apply
                    due-date changes, snooze, or revisit closed changes.
                  </Trans>
                </ConceptLabel>
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
      ) : null}

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

      <div className="flex w-fit rounded-md border border-divider-subtle bg-background-default p-1">
        {PULSE_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded px-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary',
              pulseView === view && 'bg-background-section text-text-primary',
            )}
            onClick={() => setPulseView(view)}
          >
            {view === 'all' ? <Trans>All Pulse</Trans> : <Trans>Priority Queue</Trans>}
            {view === 'priority' && priorityEnabled && priorityItems.length > 0 ? (
              <span className="font-mono text-xs tabular-nums text-text-tertiary">
                {priorityItems.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {pulseView === 'priority' && !priorityEnabled ? (
        <PriorityLockedPanel />
      ) : pulseView === 'priority' ? (
        <PriorityQueueView
          query={priorityQueueQuery}
          items={priorityItems}
          onReview={(alertId) => openDrawer(alertId)}
        />
      ) : alertsQuery.isLoading ? (
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
  return summarizePulseSources(sources, { emptyLabel: 'configured Pulse sources' })
}

function enabledSourceCount(sources: readonly PulseSourceHealth[]): number {
  return enabledPulseSourceCount(sources)
}

function SourceAttentionAlert({ sources }: { sources: readonly PulseSourceHealth[] }) {
  const sourceCount = sources.length
  return (
    <Alert variant="warning">
      <AlertTriangleIcon />
      <AlertTitle>
        <Trans>Pulse source needs attention</Trans>
      </AlertTitle>
      <AlertDescription>
        <Plural
          value={sourceCount}
          one="# source needs attention. Alerts remain reviewable."
          other="# sources need attention. Alerts remain reviewable."
        />
      </AlertDescription>
    </Alert>
  )
}

function PriorityLockedPanel() {
  return (
    <Alert>
      <LockKeyholeIcon />
      <AlertTitle>
        <Trans>Priority Queue requires Team</Trans>
      </AlertTitle>
      <AlertDescription>
        <Trans>
          Team and Enterprise add priority Pulse matching, manager review, and batch confirmation
          for high-risk alerts.
        </Trans>
      </AlertDescription>
    </Alert>
  )
}

function PriorityQueueView({
  query,
  items,
  onReview,
}: {
  query: {
    isLoading: boolean
    isError: boolean
    error: unknown
    refetch: () => unknown
  }
  items: readonly PulsePriorityQueueItem[]
  onReview: (alertId: string) => void
}) {
  const { t } = useLingui()
  if (query.isLoading) return <SkeletonList sources={EMPTY_SOURCES} />
  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>
          <Trans>Couldn't load priority queue</Trans>
        </AlertTitle>
        <AlertDescription>
          {rpcErrorMessage(query.error) ?? t`Please try again.`}{' '}
          <button type="button" className="underline" onClick={() => void query.refetch()}>
            <Trans>Retry</Trans>
          </button>
        </AlertDescription>
      </Alert>
    )
  }
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-divider-regular bg-background-section p-5 text-sm text-text-secondary">
        <Trans>No high-risk Pulse alerts need manager review right now.</Trans>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <PriorityQueueCard
          key={item.alert.id}
          item={item}
          onReview={() => onReview(item.alert.id)}
        />
      ))}
    </div>
  )
}

function PriorityQueueCard({
  item,
  onReview,
}: {
  item: PulsePriorityQueueItem
  onReview: () => void
}) {
  const levelVariant =
    item.level === 'urgent' ? 'destructive' : item.level === 'high' ? 'warning' : 'secondary'
  return (
    <article className="grid gap-2 rounded-md border border-divider-subtle bg-background-default p-3">
      <header className="flex flex-wrap items-center gap-2">
        <Badge variant={levelVariant}>{priorityLevelLabel(item.level)}</Badge>
        <span className="font-mono text-xs tabular-nums text-text-tertiary">
          <Trans>Score {item.priorityScore}</Trans>
        </span>
        {item.review ? <PriorityReviewStatusBadge status={item.review.status} /> : null}
        <h3 className="min-w-0 flex-1 truncate text-md font-medium text-text-primary">
          {item.alert.title}
        </h3>
      </header>
      <p className="text-sm text-text-secondary">
        <span className="font-mono tabular-nums text-text-primary">
          {item.alert.matchedCount + item.alert.needsReviewCount}
        </span>{' '}
        <Trans>clients may be affected</Trans>
        {item.alert.needsReviewCount > 0 ? (
          <>
            {' · '}
            <span className="font-mono tabular-nums text-text-warning">
              <Trans>{item.alert.needsReviewCount} need review</Trans>
            </span>
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {item.priorityReasons.map((reason) => (
          <Badge key={reason.key} variant="outline">
            {reasonLabel(reason.key)}
          </Badge>
        ))}
      </div>
      <footer className="flex justify-end">
        <Button size="sm" onClick={onReview}>
          <Trans>Review</Trans>
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </footer>
    </article>
  )
}

function priorityLevelLabel(level: PulsePriorityQueueItem['level']) {
  if (level === 'urgent') return <Trans>Urgent</Trans>
  if (level === 'high') return <Trans>High</Trans>
  return <Trans>Normal</Trans>
}

function PriorityReviewStatusBadge({
  status,
}: {
  status: NonNullable<PulsePriorityQueueItem['review']>['status']
}) {
  if (status === 'reviewed') {
    return (
      <Badge variant="success">
        <Trans>Reviewed</Trans>
      </Badge>
    )
  }
  if (status === 'applied') {
    return (
      <Badge variant="secondary">
        <Trans>Applied</Trans>
      </Badge>
    )
  }
  return (
    <Badge variant="warning">
      <Trans>Open review</Trans>
    </Badge>
  )
}

function reasonLabel(key: PulsePriorityQueueItem['priorityReasons'][number]['key']) {
  if (key === 'preparer_requested') return <Trans>Requested</Trans>
  if (key === 'needs_review_matches') return <Trans>Needs review</Trans>
  if (key === 'low_confidence') return <Trans>Low confidence</Trans>
  if (key === 'source_attention') return <Trans>Source attention</Trans>
  return <Trans>High impact</Trans>
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
  const count = enabledSourceCount(sources)
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-divider-regular bg-background-default px-4 py-5 text-md text-text-secondary">
      <PulsingDot tone="success" active />
      <span className="flex-1">
        {count > 0 ? (
          <Trans>
            All clear. We're watching official federal and state sources (
            <Plural value={count} one="# source" other="# sources" />
            ); new matches will appear here.
          </Trans>
        ) : (
          <Trans>
            All clear. We're watching configured Pulse sources; new matches will appear here.
          </Trans>
        )}
      </span>
    </div>
  )
}
