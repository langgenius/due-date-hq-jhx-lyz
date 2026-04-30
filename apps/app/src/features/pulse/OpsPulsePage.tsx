import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  CheckCircleIcon,
  LinkIcon,
  PauseCircleIcon,
  RefreshCcwIcon,
  ShieldAlertIcon,
  XCircleIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge, BadgeStatusDot } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Input } from '@duedatehq/ui/components/ui/input'
import { Label } from '@duedatehq/ui/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@duedatehq/ui/components/ui/tabs'
import { Textarea } from '@duedatehq/ui/components/ui/textarea'

type OpsPulse = {
  pulseId: string
  source: string
  sourceUrl: string
  publishedAt: string
  summary: string
  sourceExcerpt: string
  jurisdiction: string
  counties: string[]
  forms: string[]
  entityTypes: string[]
  originalDueDate: string
  newDueDate: string
  confidence: number
  status: string
  requiresHumanReview: boolean
}

type OpsSignal = {
  id: string
  sourceId: string
  title: string
  officialSourceUrl: string
  publishedAt: string
  tier: string
  jurisdiction: string
  status: 'open' | 'linked' | 'dismissed'
  linkedPulseId: string | null
}

type OpsSource = {
  sourceId: string
  tier: string
  jurisdiction: string
  enabled: boolean
  healthStatus: 'healthy' | 'degraded' | 'failing' | 'paused'
  lastCheckedAt: string | null
  lastSuccessAt: string | null
  nextCheckAt: string | null
  consecutiveFailures: number
  lastError: string | null
}

type OpsSnapshot = {
  id: string
  sourceId: string
  title: string
  officialSourceUrl: string
  publishedAt: string
  fetchedAt: string
  parseStatus: string
  failureReason: string | null
}

type OpsPulseDetail = {
  pulse: OpsPulse
  rawText: string | null
}

const QUERY_KEY = ['pulse-ops'] as const

function readStoredValue(key: string): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key) ?? ''
}

async function opsFetch<T>(
  token: string,
  path: string,
  init: RequestInit & { body?: BodyInit | null } = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')
  const response = await fetch(`/api/ops/pulse${path}`, {
    ...init,
    headers,
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`)
  }
  // eslint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- ops API JSON shape is validated by the token-protected server route.
  return (await response.json()) as T
}

function storeValue(key: string, value: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, value)
}

export function OpsPulsePage() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => readStoredValue('pulseOpsToken'))
  const [actorId, setActorId] = useState(() => readStoredValue('pulseOpsActorId') || 'ops-web')
  const [reason, setReason] = useState('')
  const [selectedPulseId, setSelectedPulseId] = useState<string | null>(null)
  const [linkPulseId, setLinkPulseId] = useState('')
  const enabled = token.trim().length > 0

  const pendingQuery = useQuery({
    queryKey: [...QUERY_KEY, 'pending', token],
    queryFn: () => opsFetch<{ pulses: OpsPulse[] }>(token, '/pending'),
    enabled,
  })
  const sourcesQuery = useQuery({
    queryKey: [...QUERY_KEY, 'sources', token],
    queryFn: () => opsFetch<{ sources: OpsSource[] }>(token, '/sources'),
    enabled,
  })
  const signalsQuery = useQuery({
    queryKey: [...QUERY_KEY, 'signals', token],
    queryFn: () => opsFetch<{ signals: OpsSignal[] }>(token, '/signals'),
    enabled,
  })
  const snapshotsQuery = useQuery({
    queryKey: [...QUERY_KEY, 'snapshots', token],
    queryFn: () => opsFetch<{ snapshots: OpsSnapshot[] }>(token, '/snapshots/failed'),
    enabled,
  })
  const detailQuery = useQuery({
    queryKey: [...QUERY_KEY, 'detail', token, selectedPulseId],
    queryFn: () => opsFetch<OpsPulseDetail>(token, `/${selectedPulseId ?? ''}`),
    enabled: enabled && selectedPulseId !== null,
  })

  const invalidateOps = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  const actionMutation = useMutation({
    mutationFn: async (input: { path: string; body?: Record<string, unknown>; label: string }) =>
      opsFetch<{ ok: true }>(token, input.path, {
        method: 'POST',
        body: JSON.stringify(input.body ?? {}),
      }),
    onSuccess: (_result, input) => {
      toast.success(input.label)
      invalidateOps()
    },
    onError: (error) => {
      toast.error(t`Pulse ops action failed`, {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })

  const reviewBody = useMemo(
    () => ({ actorId, reviewedBy: actorId, reason: reason.trim() || null }),
    [actorId, reason],
  )

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Trans>Internal operations</Trans>
        </span>
        <h1 className="text-2xl font-semibold leading-tight text-text-primary">
          <Trans>Pulse Ops</Trans>
        </h1>
        <p className="max-w-[720px] text-md text-text-secondary">
          <Trans>
            Review pending Pulse extracts, inspect source health, reconcile signals, and retry
            failed snapshots. This page uses the token-protected ops API.
          </Trans>
        </p>
      </header>

      <section className="grid gap-3 rounded-md border border-divider-subtle bg-background-default p-3 md:grid-cols-[minmax(260px,1fr)_220px_auto] md:items-end">
        <label className="grid gap-1">
          <Label htmlFor="pulse-ops-token">
            <Trans>Ops token</Trans>
          </Label>
          <Input
            id="pulse-ops-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={t`Bearer token`}
          />
        </label>
        <label className="grid gap-1">
          <Label htmlFor="pulse-ops-actor">
            <Trans>Actor id</Trans>
          </Label>
          <Input
            id="pulse-ops-actor"
            value={actorId}
            onChange={(event) => setActorId(event.target.value)}
          />
        </label>
        <Button
          variant="outline"
          onClick={() => {
            storeValue('pulseOpsToken', token)
            storeValue('pulseOpsActorId', actorId)
            toast.success(t`Pulse ops credentials saved locally`)
            invalidateOps()
          }}
        >
          <Trans>Save</Trans>
        </Button>
      </section>

      {!enabled ? (
        <Alert>
          <ShieldAlertIcon />
          <AlertTitle>
            <Trans>Token required</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>Paste the configured PULSE_OPS_TOKEN to load the internal workbench.</Trans>
          </AlertDescription>
        </Alert>
      ) : null}

      <label className="grid gap-1">
        <Label htmlFor="pulse-ops-reason">
          <Trans>Reason for review actions</Trans>
        </Label>
        <Textarea
          id="pulse-ops-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t`Required for reject, quarantine, and source revoke decisions`}
        />
      </label>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            <Trans>Pending review</Trans>
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Trans>Sources</Trans>
          </TabsTrigger>
          <TabsTrigger value="signals">
            <Trans>Signals</Trans>
          </TabsTrigger>
          <TabsTrigger value="snapshots">
            <Trans>Failed snapshots</Trans>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PulseOpsPending
            pulses={pendingQuery.data?.pulses ?? []}
            isLoading={pendingQuery.isLoading}
            selectedPulseId={selectedPulseId}
            detail={detailQuery.data}
            onSelectPulse={setSelectedPulseId}
            onAction={(pulseId, action) =>
              actionMutation.mutate({
                path: `/${pulseId}/${action}`,
                body: reviewBody,
                label: t`Pulse ${action} queued`,
              })
            }
          />
        </TabsContent>

        <TabsContent value="sources">
          <PulseOpsSources
            sources={sourcesQuery.data?.sources ?? []}
            isLoading={sourcesQuery.isLoading}
            onAction={(sourceId, action) =>
              actionMutation.mutate({
                path: `/sources/${sourceId}/${action}`,
                body: action === 'revoke' ? reviewBody : {},
                label: t`Source action queued`,
              })
            }
          />
        </TabsContent>

        <TabsContent value="signals">
          <PulseOpsSignals
            signals={signalsQuery.data?.signals ?? []}
            isLoading={signalsQuery.isLoading}
            linkPulseId={linkPulseId}
            onChangeLinkPulseId={setLinkPulseId}
            onLinkOpen={() =>
              actionMutation.mutate({
                path: '/signals/link-open',
                label: t`Signal link pass queued`,
              })
            }
            onSignalAction={(signalId, action) =>
              actionMutation.mutate({
                path: `/signals/${signalId}/${action}`,
                body: action === 'link' ? { pulseId: linkPulseId } : {},
                label: t`Signal action queued`,
              })
            }
          />
        </TabsContent>

        <TabsContent value="snapshots">
          <PulseOpsSnapshots
            snapshots={snapshotsQuery.data?.snapshots ?? []}
            isLoading={snapshotsQuery.isLoading}
            onRetry={(snapshotId) =>
              actionMutation.mutate({
                path: `/snapshots/${snapshotId}/retry`,
                label: t`Snapshot retry queued`,
              })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PulseOpsPending({
  pulses,
  isLoading,
  selectedPulseId,
  detail,
  onSelectPulse,
  onAction,
}: {
  pulses: OpsPulse[]
  isLoading: boolean
  selectedPulseId: string | null
  detail: OpsPulseDetail | undefined
  onSelectPulse: (pulseId: string) => void
  onAction: (pulseId: string, action: 'approve' | 'reject' | 'quarantine') => void
}) {
  if (isLoading) return <OpsLoading label={<Trans>Loading pending Pulse extracts…</Trans>} />
  if (pulses.length === 0) return <OpsEmpty label={<Trans>No pending Pulse extracts.</Trans>} />

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
      <div className="grid gap-2">
        {pulses.map((pulse) => (
          <article
            key={pulse.pulseId}
            className="grid gap-2 rounded-md border border-divider-subtle bg-background-default p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="warning" label={pulse.source} />
              <span className="font-mono text-xs text-text-tertiary">
                {pulse.jurisdiction} · {pulse.originalDueDate} → {pulse.newDueDate}
              </span>
            </div>
            <h2 className="text-md font-semibold text-text-primary">{pulse.summary}</h2>
            <p className="text-sm text-text-secondary">{pulse.sourceExcerpt}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onSelectPulse(pulse.pulseId)}>
                <Trans>Inspect raw</Trans>
              </Button>
              <Button size="sm" onClick={() => onAction(pulse.pulseId, 'approve')}>
                <CheckCircleIcon data-icon="inline-start" />
                <Trans>Approve</Trans>
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction(pulse.pulseId, 'reject')}>
                <XCircleIcon data-icon="inline-start" />
                <Trans>Reject</Trans>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onAction(pulse.pulseId, 'quarantine')}
              >
                <ShieldAlertIcon data-icon="inline-start" />
                <Trans>Quarantine</Trans>
              </Button>
            </div>
          </article>
        ))}
      </div>
      <aside className="min-h-[280px] rounded-md border border-divider-subtle bg-background-default p-3">
        {selectedPulseId && detail ? (
          <div className="grid gap-3">
            <h2 className="text-md font-semibold text-text-primary">{detail.pulse.summary}</h2>
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-background-section p-3 text-xs text-text-secondary">
              {detail.rawText ?? detail.pulse.sourceExcerpt}
            </pre>
          </div>
        ) : (
          <OpsEmpty label={<Trans>Select a Pulse to inspect raw source text.</Trans>} />
        )}
      </aside>
    </div>
  )
}

function PulseOpsSources({
  sources,
  isLoading,
  onAction,
}: {
  sources: OpsSource[]
  isLoading: boolean
  onAction: (sourceId: string, action: 'enable' | 'disable' | 'revoke') => void
}) {
  if (isLoading) return <OpsLoading label={<Trans>Loading source health…</Trans>} />
  if (sources.length === 0)
    return <OpsEmpty label={<Trans>No source state has been recorded.</Trans>} />

  return (
    <div className="grid gap-2">
      {sources.map((source) => (
        <article
          key={source.sourceId}
          className="grid gap-2 rounded-md border border-divider-subtle bg-background-default p-3 md:grid-cols-[1fr_auto]"
        >
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                tone={source.healthStatus === 'healthy' ? 'success' : 'warning'}
                label={source.healthStatus}
              />
              <h2 className="font-mono text-sm text-text-primary">{source.sourceId}</h2>
              <span className="text-xs text-text-tertiary">
                {source.tier} · {source.jurisdiction}
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              <Trans>
                Last success {source.lastSuccessAt ?? 'never'} · next check{' '}
                {source.nextCheckAt ?? 'paused'} · failures {source.consecutiveFailures}
              </Trans>
            </p>
            {source.lastError ? (
              <p className="text-sm text-text-warning">{source.lastError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(source.sourceId, source.enabled ? 'disable' : 'enable')}
            >
              <PauseCircleIcon data-icon="inline-start" />
              {source.enabled ? <Trans>Disable</Trans> : <Trans>Enable</Trans>}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onAction(source.sourceId, 'revoke')}
            >
              <ShieldAlertIcon data-icon="inline-start" />
              <Trans>Revoke source</Trans>
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}

function PulseOpsSignals({
  signals,
  isLoading,
  linkPulseId,
  onChangeLinkPulseId,
  onLinkOpen,
  onSignalAction,
}: {
  signals: OpsSignal[]
  isLoading: boolean
  linkPulseId: string
  onChangeLinkPulseId: (value: string) => void
  onLinkOpen: () => void
  onSignalAction: (signalId: string, action: 'link' | 'dismiss') => void
}) {
  if (isLoading) return <OpsLoading label={<Trans>Loading source signals…</Trans>} />

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 rounded-md border border-divider-subtle bg-background-default p-3 md:flex-row md:items-end">
        <label className="grid flex-1 gap-1">
          <Label htmlFor="pulse-signal-link-id">
            <Trans>Pulse id for manual link</Trans>
          </Label>
          <Input
            id="pulse-signal-link-id"
            value={linkPulseId}
            onChange={(event) => onChangeLinkPulseId(event.target.value)}
          />
        </label>
        <Button variant="outline" onClick={onLinkOpen}>
          <LinkIcon data-icon="inline-start" />
          <Trans>Auto-link open signals</Trans>
        </Button>
      </div>
      {signals.length === 0 ? (
        <OpsEmpty label={<Trans>No signals found.</Trans>} />
      ) : (
        signals.map((signal) => (
          <article
            key={signal.id}
            className="grid gap-2 rounded-md border border-divider-subtle bg-background-default p-3 md:grid-cols-[1fr_auto]"
          >
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={signal.status === 'open' ? 'warning' : 'disabled'}
                  label={signal.status}
                />
                <span className="font-mono text-sm text-text-primary">{signal.sourceId}</span>
                <span className="text-xs text-text-tertiary">
                  {signal.tier} · {signal.jurisdiction} · {signal.publishedAt}
                </span>
              </div>
              <h2 className="text-md font-semibold text-text-primary">{signal.title}</h2>
              {signal.linkedPulseId ? (
                <p className="font-mono text-xs text-text-tertiary">{signal.linkedPulseId}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!linkPulseId}
                onClick={() => onSignalAction(signal.id, 'link')}
              >
                <LinkIcon data-icon="inline-start" />
                <Trans>Link</Trans>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSignalAction(signal.id, 'dismiss')}
              >
                <Trans>Dismiss</Trans>
              </Button>
            </div>
          </article>
        ))
      )}
    </div>
  )
}

function PulseOpsSnapshots({
  snapshots,
  isLoading,
  onRetry,
}: {
  snapshots: OpsSnapshot[]
  isLoading: boolean
  onRetry: (snapshotId: string) => void
}) {
  if (isLoading) return <OpsLoading label={<Trans>Loading failed snapshots…</Trans>} />
  if (snapshots.length === 0) return <OpsEmpty label={<Trans>No failed snapshots.</Trans>} />

  return (
    <div className="grid gap-2">
      {snapshots.map((snapshot) => (
        <article
          key={snapshot.id}
          className="grid gap-2 rounded-md border border-divider-subtle bg-background-default p-3 md:grid-cols-[1fr_auto]"
        >
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="error" label={snapshot.sourceId} />
              <span className="font-mono text-xs text-text-tertiary">{snapshot.fetchedAt}</span>
            </div>
            <h2 className="text-md font-semibold text-text-primary">{snapshot.title}</h2>
            <p className="text-sm text-text-warning">{snapshot.failureReason}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onRetry(snapshot.id)}>
            <RefreshCcwIcon data-icon="inline-start" />
            <Trans>Retry extract</Trans>
          </Button>
        </article>
      ))}
    </div>
  )
}

function StatusBadge({
  tone,
  label,
}: {
  tone: 'success' | 'warning' | 'disabled' | 'error'
  label: string
}) {
  return (
    <Badge variant="outline" className="text-text-secondary">
      <BadgeStatusDot tone={tone} />
      {label}
    </Badge>
  )
}

function OpsLoading({ label }: { label: React.ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-md border border-divider-subtle bg-background-default p-4 text-sm text-text-secondary"
    >
      {label}
    </div>
  )
}

function OpsEmpty({ label }: { label: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-divider-regular bg-background-default p-4 text-sm text-text-secondary">
      {label}
    </div>
  )
}
