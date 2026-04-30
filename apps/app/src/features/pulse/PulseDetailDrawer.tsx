import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon, MailIcon, RotateCcwIcon, ShieldAlertIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { FirmPublic, PulseFirmAlertStatus, PulseStatus } from '@duedatehq/contracts'
import type { PulseDetail } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@duedatehq/ui/components/ui/sheet'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'

import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

import { AffectedClientsTable } from './components/AffectedClientsTable'
import { PulseConfidenceBadge } from './components/PulseConfidenceBadge'
import { PulseSourceBadge } from './components/PulseSourceBadge'
import { PulseSourceStatusBadge } from './components/PulseSourceStatusBadge'
import { PulseStatusBadge } from './components/PulseStatusBadge'
import { PulseStructuredFields } from './components/PulseStructuredFields'
import { PulsingDot, type PulsingDotTone } from './components/PulsingDot'
import { usePulseInvalidation, usePulseDetailQueryOptions } from './api'
import { isPulseConflict, pulseErrorDescriptor } from './lib/error-mapping'
import { computeSelectionStats, defaultSelection, type SelectionStats } from './lib/selection'

interface PulseDetailDrawerProps {
  alertId: string | null
  onClose: () => void
}

const APPLY_ALLOWED_ROLES: ReadonlySet<FirmPublic['role']> = new Set(['owner', 'manager'])
const REVERTABLE_STATUSES: ReadonlySet<PulseFirmAlertStatus> = new Set([
  'applied',
  'partially_applied',
])

function drawerTone(status: PulseFirmAlertStatus): PulsingDotTone {
  if (status === 'applied' || status === 'partially_applied') return 'success'
  if (status === 'matched') return 'warning'
  return 'disabled'
}

// Read RBAC from the firms cache the layout already primed. The ApplyCTA stays
// disabled until we know the user is Owner / Manager (matches server permissions).
function useCanApply(): boolean {
  const queryClient = useQueryClient()
  const firms = queryClient.getQueryData<FirmPublic[]>(
    orpc.firms.listMine.queryKey({ input: undefined }),
  )
  if (!firms) return false
  const current = firms.find((firm) => firm.isCurrent) ?? firms[0]
  if (!current) return false
  return APPLY_ALLOWED_ROLES.has(current.role)
}

// Pulse detail drawer: AI summary + structured fields + affected clients + apply
// / dismiss / revert. Apply is the safer path because the server writes audit +
// evidence + email outbox in one transaction (see packages/db/src/repo/pulse.ts).
export function PulseDetailDrawer({ alertId, onClose }: PulseDetailDrawerProps) {
  const { t, i18n } = useLingui()
  const open = alertId !== null
  const detailQuery = useQuery(usePulseDetailQueryOptions(alertId))
  const detail = detailQuery.data
  const canApply = useCanApply()
  const invalidate = usePulseInvalidation()

  const [selection, setSelection] = useState<Set<string>>(() => new Set())
  const [confirmedReviewIds, setConfirmedReviewIds] = useState<Set<string>>(() => new Set())
  const [resetKey, setResetKey] = useState<string | null>(null)

  // Re-derive default selection when the loaded alert changes — without
  // useEffect, per project rule. Render-time setState bails out after one update.
  const nextResetKey = detail ? `${detail.alert.id}:${detail.affectedClients.length}` : null
  if (detail && resetKey !== nextResetKey) {
    setSelection(defaultSelection(detail.affectedClients))
    setConfirmedReviewIds(new Set())
    setResetKey(nextResetKey)
  }
  if (!open && resetKey !== null) {
    setSelection(new Set())
    setConfirmedReviewIds(new Set())
    setResetKey(null)
  }

  const stats = useMemo<SelectionStats | null>(
    () =>
      detail ? computeSelectionStats(detail.affectedClients, selection, confirmedReviewIds) : null,
    [detail, selection, confirmedReviewIds],
  )

  const handleToggleNeedsReviewConfirmation = (obligationId: string, confirmed: boolean) => {
    setConfirmedReviewIds((current) => {
      const next = new Set(current)
      if (confirmed) next.add(obligationId)
      else next.delete(obligationId)
      return next
    })
    setSelection((current) => {
      const next = new Set(current)
      if (confirmed) next.add(obligationId)
      else next.delete(obligationId)
      return next
    })
  }

  const revertMutation = useMutation(
    orpc.pulse.revert.mutationOptions({
      onSuccess: (result) => {
        invalidate()
        toast.success(t`Reverted ${result.revertedCount} clients`)
      },
      onError: (err) => {
        toast.error(t`Couldn't undo Pulse`, {
          description: i18n._(pulseErrorDescriptor(err)),
        })
      },
    }),
  )

  const applyMutation = useMutation(
    orpc.pulse.apply.mutationOptions({
      onSuccess: (result) => {
        invalidate()
        toast.success(t`Applied to ${result.appliedCount} clients`, {
          description: t`Audit + evidence written. Undo within 24h.`,
          action: {
            label: t`Undo`,
            onClick: () => revertMutation.mutate({ alertId: result.alert.id }),
          },
        })
        onClose()
      },
      onError: (err) => {
        const description = i18n._(pulseErrorDescriptor(err)) || (rpcErrorMessage(err) ?? '')
        if (isPulseConflict(err)) {
          toast.error(t`Couldn't apply Pulse`, {
            description,
            action: {
              label: t`Refresh`,
              onClick: () => void detailQuery.refetch(),
            },
          })
          return
        }
        toast.error(t`Couldn't apply Pulse`, { description })
      },
    }),
  )

  const dismissMutation = useMutation(
    orpc.pulse.dismiss.mutationOptions({
      onSuccess: () => {
        toast.success(t`Alert dismissed`)
        invalidate()
        onClose()
      },
      onError: (err) => {
        toast.error(t`Couldn't dismiss alert`, {
          description: i18n._(pulseErrorDescriptor(err)),
        })
      },
    }),
  )

  const snoozeMutation = useMutation(
    orpc.pulse.snooze.mutationOptions({
      onSuccess: () => {
        toast.success(t`Alert snoozed`)
        invalidate()
        onClose()
      },
      onError: (err) => {
        toast.error(t`Couldn't snooze alert`, {
          description: i18n._(pulseErrorDescriptor(err)),
        })
      },
    }),
  )

  const isMutating =
    applyMutation.isPending ||
    dismissMutation.isPending ||
    revertMutation.isPending ||
    snoozeMutation.isPending

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:max-w-[100vw] sm:data-[side=right]:w-[calc(100vw-2rem)] sm:data-[side=right]:max-w-[calc(100vw-2rem)] md:data-[side=right]:w-[min(820px,calc(100vw-2rem))] md:data-[side=right]:max-w-[min(820px,calc(100vw-2rem))] xl:data-[side=right]:w-[min(880px,calc(100vw-2rem))] xl:data-[side=right]:max-w-[min(880px,calc(100vw-2rem))]"
      >
        <SheetHeader className="border-b border-divider-subtle">
          {detailQuery.isLoading || !detail ? (
            <DetailHeaderSkeleton />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <PulsingDot tone={drawerTone(detail.alert.status)} active />
                <PulseSourceBadge source={detail.alert.source} sourceUrl={detail.alert.sourceUrl} />
                <PulseConfidenceBadge confidence={detail.alert.confidence} />
                <PulseStatusBadge status={detail.alert.status} />
                <PulseSourceStatusBadge status={detail.alert.sourceStatus} />
              </div>
              <SheetTitle className="text-lg">{detail.alert.title}</SheetTitle>
              <SheetDescription className="text-md text-text-secondary">
                {detail.alert.summary}
              </SheetDescription>
            </div>
          )}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {detailQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>
                <Trans>Couldn't load this alert</Trans>
              </AlertTitle>
              <AlertDescription>
                {i18n._(pulseErrorDescriptor(detailQuery.error))}{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void detailQuery.refetch()}
                >
                  <Trans>Retry</Trans>
                </button>
              </AlertDescription>
            </Alert>
          ) : null}

          {detail ? (
            <>
              <PulseStructuredFields detail={detail} />

              {!canApply ? (
                <Alert>
                  <ShieldAlertIcon />
                  <AlertTitle>
                    <Trans>Read-only view</Trans>
                  </AlertTitle>
                  <AlertDescription>
                    <Trans>Only Owners and Managers can apply Pulse changes.</Trans>
                  </AlertDescription>
                </Alert>
              ) : null}

              {detail.alert.sourceStatus === 'source_revoked' ? (
                <Alert variant="destructive">
                  <ShieldAlertIcon />
                  <AlertTitle>
                    <Trans>Source revoked</Trans>
                  </AlertTitle>
                  <AlertDescription>
                    <Trans>
                      This source is no longer trusted. The historical alert remains visible, but
                      new apply, dismiss, snooze, and undo actions are disabled.
                    </Trans>
                  </AlertDescription>
                </Alert>
              ) : null}

              <section className="flex flex-col gap-3">
                <header className="flex items-baseline justify-between">
                  <h3 className="text-md font-semibold text-text-primary">
                    <Trans>Affected clients</Trans>
                  </h3>
                  {stats ? <SelectionSummary stats={stats} /> : null}
                </header>
                <AffectedClientsTable
                  rows={detail.affectedClients}
                  selection={selection}
                  confirmedReviewIds={confirmedReviewIds}
                  onChangeSelection={setSelection}
                  onToggleNeedsReviewConfirmation={handleToggleNeedsReviewConfirmation}
                  readOnly={!canApply}
                />
              </section>

              <ApplySafetyChecklist />
            </>
          ) : null}
        </div>

        <SheetFooter className="border-t border-divider-subtle">
          {detail ? (
            <DrawerActions
              alertStatus={detail.alert.status}
              sourceStatus={detail.alert.sourceStatus}
              selectionCount={stats?.selectedCount ?? 0}
              canApply={canApply}
              isMutating={isMutating}
              onApply={() =>
                applyMutation.mutate({
                  alertId: detail.alert.id,
                  obligationIds: Array.from(selection),
                  confirmedObligationIds: Array.from(selection).filter((obligationId) =>
                    confirmedReviewIds.has(obligationId),
                  ),
                })
              }
              onDismiss={() => dismissMutation.mutate({ alertId: detail.alert.id })}
              onSnooze={() =>
                snoozeMutation.mutate({
                  alertId: detail.alert.id,
                  until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                })
              }
              onRevert={() => revertMutation.mutate({ alertId: detail.alert.id })}
              onCopyDraft={() => {
                void navigator.clipboard.writeText(buildClientEmailDraft(detail)).then(
                  () => toast.success(t`Client email draft copied`),
                  () => toast.error(t`Couldn't copy client email draft`),
                )
              }}
            />
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DrawerActions({
  alertStatus,
  sourceStatus,
  selectionCount,
  canApply,
  isMutating,
  onApply,
  onDismiss,
  onSnooze,
  onRevert,
  onCopyDraft,
}: {
  alertStatus: PulseFirmAlertStatus
  sourceStatus: PulseStatus
  selectionCount: number
  canApply: boolean
  isMutating: boolean
  onApply: () => void
  onDismiss: () => void
  onSnooze: () => void
  onRevert: () => void
  onCopyDraft: () => void
}) {
  const showRevert = REVERTABLE_STATUSES.has(alertStatus)
  const isDismissed = alertStatus === 'dismissed'
  const sourceRevoked = sourceStatus === 'source_revoked'
  const isClosed = alertStatus === 'reverted' || isDismissed || sourceRevoked
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="ghost" size="sm" disabled={isMutating} onClick={onCopyDraft}>
        <MailIcon data-icon="inline-start" />
        <Trans>Copy client email draft</Trans>
      </Button>
      {showRevert ? (
        <Button
          variant="outline"
          size="sm"
          disabled={!canApply || isMutating || sourceRevoked}
          onClick={onRevert}
        >
          <RotateCcwIcon data-icon="inline-start" />
          <Trans>Undo (24h)</Trans>
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={!canApply || isMutating || isClosed}
        onClick={onDismiss}
      >
        <Trans>Dismiss</Trans>
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!canApply || isMutating || isClosed}
        onClick={onSnooze}
      >
        <Trans>Snooze 24h</Trans>
      </Button>
      <Button
        size="sm"
        disabled={!canApply || isMutating || isClosed || selectionCount === 0}
        onClick={onApply}
        aria-busy={isMutating || undefined}
      >
        {selectionCount === 0 ? (
          <Trans>Select clients to apply</Trans>
        ) : (
          <Plural value={selectionCount} one="Apply to # client" other="Apply to # clients" />
        )}
      </Button>
    </div>
  )
}

function buildClientEmailDraft(detail: PulseDetail): string {
  const affectedClients = detail.affectedClients
    .filter((row) => row.matchStatus === 'eligible' || row.matchStatus === 'already_applied')
    .map((row) => `- ${row.clientName}: ${row.currentDueDate} -> ${row.newDueDate}`)
  return [
    `Subject: Deadline update: ${detail.alert.title}`,
    '',
    'Hi,',
    '',
    detail.alert.summary,
    '',
    `Original due date: ${detail.originalDueDate}`,
    `New due date: ${detail.newDueDate}`,
    '',
    'Affected client deadlines:',
    ...(affectedClients.length > 0
      ? affectedClients
      : ['- No client-specific deadline has been applied yet.']),
    '',
    `Source: ${detail.alert.sourceUrl}`,
    '',
    'This is a draft. Please review before sending.',
  ].join('\n')
}

function SelectionSummary({ stats }: { stats: SelectionStats }) {
  return (
    <span className="text-sm text-text-tertiary">
      <Trans>
        {stats.selectedCount} selected · {stats.selectableCount} eligible · {stats.needsReviewCount}{' '}
        need review
      </Trans>
    </span>
  )
}

function ApplySafetyChecklist() {
  const items: Array<[string, React.ReactNode]> = [
    ['audit', <Trans key="audit">Logged to audit trail</Trans>],
    ['evidence', <Trans key="evidence">Pulse evidence linked to each obligation</Trans>],
    [
      'email',
      <Trans key="email">
        Digest queued for owners and managers; delivery depends on email config
      </Trans>,
    ],
    ['undo', <Trans key="undo">Undo available for 24 hours</Trans>],
  ]
  return (
    <ul className="grid gap-1 rounded-lg border border-dashed border-divider-regular bg-background-section p-3 text-sm text-text-secondary">
      {items.map(([key, node]) => (
        <li key={key} className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 rounded-full bg-text-success" />
          {node}
        </li>
      ))}
    </ul>
  )
}

function DetailHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}
