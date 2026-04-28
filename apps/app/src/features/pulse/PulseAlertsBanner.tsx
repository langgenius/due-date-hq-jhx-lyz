import { useMutation, useQuery } from '@tanstack/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { ChevronRightIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { PulseAlertPublic } from '@duedatehq/contracts'
import { Button } from '@duedatehq/ui/components/ui/button'
import { cn } from '@duedatehq/ui/lib/utils'

import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

import { usePulseDrawer } from './DrawerProvider'
import { usePulseInvalidation, usePulseListAlertsQueryOptions } from './api'
import { PulsingDot, type PulsingDotTone } from './components/PulsingDot'
import { pulseErrorDescriptor } from './lib/error-mapping'

// Pulse banner — a single-line "heartbeat" strip that lives at the top of
// the dashboard. Calm by default (a green pulsing dot + the watcher list);
// shifts to warning tone with the most recent alert inline when a Pulse
// matches a firm's clients. Mirrors DESIGN.md "calm, dense, hairline-first":
// no large warning panel, no skeleton block — just a 36px row that reads
// like a vital sign on a hospital monitor.
export function PulseAlertsBanner() {
  const alertsQuery = useQuery(usePulseListAlertsQueryOptions(5))
  const alerts = alertsQuery.data?.alerts ?? []
  const isLoading = alertsQuery.isLoading
  const hasAlerts = alerts.length > 0

  if (isLoading) return <PulseStrip tone="warning" active label={<LoadingLabel />} />

  if (!hasAlerts) {
    return (
      <PulseStrip
        tone="success"
        active
        label={<WatchingLabel lastCheckedAt={null} />}
        meta={<PulseMetaTimestamp iso={null} />}
      />
    )
  }

  return <ActivePulseStrip alerts={alerts} />
}

interface PulseStripProps {
  tone: PulsingDotTone
  active: boolean
  label: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
  onClick?: () => void
  className?: string
}

// Shared chrome for every Pulse banner state — single hairline row, mono
// metadata aligned right, optional inline actions. Made interactive only
// when `onClick` is provided so the read-only states stay non-clickable.
function PulseStrip({ tone, active, label, meta, actions, onClick, className }: PulseStripProps) {
  const interactive = Boolean(onClick)
  const Element: 'button' | 'div' = interactive ? 'button' : 'div'
  return (
    <Element
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group/pulse flex h-9 w-full items-center gap-3 rounded-md border border-divider-subtle bg-background-default px-3 text-base text-text-secondary transition-colors',
        interactive
          ? 'cursor-pointer text-left hover:border-divider-regular hover:bg-background-default-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-accent-active-alt'
          : '',
        className,
      )}
      data-tone={tone}
    >
      <PulsingDot tone={tone} active={active} />
      <span className="flex min-w-0 flex-1 items-center gap-2">{label}</span>
      {meta ? (
        <span className="hidden shrink-0 items-center gap-2 font-mono text-xs tabular-nums text-text-tertiary md:inline-flex">
          {meta}
        </span>
      ) : null}
      {actions ? <span className="shrink-0">{actions}</span> : null}
      {interactive && !actions ? (
        <ChevronRightIcon
          className="size-3.5 shrink-0 text-text-tertiary transition-transform group-hover/pulse:translate-x-0.5"
          aria-hidden
        />
      ) : null}
    </Element>
  )
}

// Renders the strip in its active (alert-bearing) state. We pull this out so
// the mutation hook stays out of the empty / loading branches.
function ActivePulseStrip({ alerts }: { alerts: readonly PulseAlertPublic[] }) {
  const { i18n, t } = useLingui()
  const { openDrawer } = usePulseDrawer()
  const invalidate = usePulseInvalidation()

  const [primary, ...rest] = alerts
  if (!primary) return null

  const dismissMutation = useMutation(
    orpc.pulse.dismiss.mutationOptions({
      onSuccess: () => {
        toast.success(t`Alert dismissed`)
        invalidate()
      },
      onError: (err) => {
        toast.error(t`Couldn't dismiss alert`, {
          description: i18n._(pulseErrorDescriptor(err)) || (rpcErrorMessage(err) ?? undefined),
        })
      },
    }),
  )

  const tone: PulsingDotTone = primary.needsReviewCount > 0 ? 'warning' : 'warning'
  const totalImpact = primary.matchedCount + primary.needsReviewCount

  return (
    <PulseStrip
      tone={tone}
      active
      onClick={() => openDrawer(primary.id)}
      label={
        <>
          <span className="truncate font-medium text-text-primary" title={primary.title}>
            {primary.source}
          </span>
          <span aria-hidden className="text-text-tertiary">
            ·
          </span>
          <span className="truncate text-text-secondary" title={primary.title}>
            {primary.title}
          </span>
          {totalImpact > 0 ? (
            <>
              <span aria-hidden className="text-text-tertiary">
                ·
              </span>
              <span className="shrink-0 font-mono tabular-nums text-text-primary">
                <Plural value={totalImpact} one="# client" other="# clients" />
              </span>
            </>
          ) : null}
          {rest.length > 0 ? (
            <>
              <span aria-hidden className="text-text-tertiary">
                ·
              </span>
              <span className="shrink-0 font-mono tabular-nums text-text-tertiary">
                <Plural value={rest.length} one="+ # more" other="+ # more" />
              </span>
            </>
          ) : null}
        </>
      }
      meta={<PulseMetaTimestamp iso={newestPublishedAt(alerts)} />}
      actions={
        <span
          className="flex items-center gap-1"
          // Stop the parent strip click from firing when the user reaches
          // the inline Dismiss button.
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={dismissMutation.isPending}
            onClick={() => dismissMutation.mutate({ alertId: primary.id })}
          >
            <Trans>Dismiss</Trans>
          </Button>
          <Button size="sm" onClick={() => openDrawer(primary.id)}>
            <Trans>Review</Trans>
          </Button>
        </span>
      }
    />
  )
}

function LoadingLabel() {
  return (
    <span className="truncate text-text-tertiary">
      <Trans>Checking IRS + state sources…</Trans>
    </span>
  )
}

function WatchingLabel({ lastCheckedAt }: { lastCheckedAt: string | null }) {
  // Calm copy — the watcher promise is the whole message when nothing is
  // matching. We render the lastCheckedAt only in the right-aligned mono meta.
  void lastCheckedAt
  return (
    <span className="truncate text-text-secondary">
      <Trans>All clear · Watching IRS + CA / NY / TX / FL / WA</Trans>
    </span>
  )
}

function PulseMetaTimestamp({ iso }: { iso: string | null }) {
  if (!iso) {
    return (
      <span>
        <Trans>Live</Trans>
      </span>
    )
  }
  const minutes = minutesSince(iso)
  return (
    <span>
      <Plural value={minutes} one="# min ago" other="# min ago" />
    </span>
  )
}

function newestPublishedAt(alerts: readonly PulseAlertPublic[]): string | null {
  let newest: string | null = null
  for (const alert of alerts) {
    if (!newest || new Date(alert.publishedAt).getTime() > new Date(newest).getTime()) {
      newest = alert.publishedAt
    }
  }
  return newest
}

function minutesSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.round(ms / 60000))
}
