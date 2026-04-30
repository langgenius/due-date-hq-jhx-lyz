import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLinkIcon, FileSearchIcon } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'

import type { AuditEventPublic, EvidencePublic } from '@duedatehq/contracts'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Separator } from '@duedatehq/ui/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@duedatehq/ui/components/ui/sheet'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'

import { orpc } from '@/lib/rpc'
import { formatDateTimeWithTimezone } from '@/lib/utils'

export interface OpenEvidenceInput {
  obligationId: string
  label: string
  focusEvidenceId?: string | null
}

interface EvidenceDrawerContextValue {
  openEvidence: (input: OpenEvidenceInput) => void
  closeEvidence: () => void
}

const EvidenceDrawerContext = createContext<EvidenceDrawerContextValue | null>(null)

export function EvidenceDrawerProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<OpenEvidenceInput | null>(null)
  const openEvidence = useCallback((input: OpenEvidenceInput) => setRequest(input), [])
  const closeEvidence = useCallback(() => setRequest(null), [])
  const value = useMemo(() => ({ openEvidence, closeEvidence }), [closeEvidence, openEvidence])

  return (
    <EvidenceDrawerContext.Provider value={value}>
      {children}
      <EvidenceDrawer request={request} onClose={closeEvidence} />
    </EvidenceDrawerContext.Provider>
  )
}

export function useEvidenceDrawer(): EvidenceDrawerContextValue {
  const context = useContext(EvidenceDrawerContext)
  if (!context) throw new Error('useEvidenceDrawer must be used within EvidenceDrawerProvider')
  return context
}

function EvidenceDrawer({
  request,
  onClose,
}: {
  request: OpenEvidenceInput | null
  onClose: () => void
}) {
  const obligationId = request?.obligationId ?? ''
  const evidenceQuery = useQuery({
    ...orpc.evidence.listByObligation.queryOptions({ input: { obligationId } }),
    enabled: request !== null,
  })
  const auditQuery = useQuery({
    ...orpc.audit.list.queryOptions({
      input: {
        entityType: 'obligation_instance',
        entityId: obligationId,
        range: 'all',
        limit: 50,
      },
    }),
    enabled: request !== null,
  })

  return (
    <Sheet open={request !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[520px]">
        <SheetHeader className="border-b border-divider-subtle">
          <SheetTitle className="flex items-center gap-2">
            <FileSearchIcon className="size-4 text-text-accent" aria-hidden />
            <Trans>Evidence chain</Trans>
          </SheetTitle>
          <SheetDescription>
            {request?.label ?? <Trans>Obligation evidence</Trans>}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 px-6 pb-6">
          <EvidenceSummary request={request} />
          <EvidenceTimeline
            evidence={evidenceQuery.data?.evidence ?? []}
            loading={evidenceQuery.isLoading}
            focusEvidenceId={request?.focusEvidenceId ?? null}
          />
          <Separator />
          <AuditTimeline events={auditQuery.data?.events ?? []} loading={auditQuery.isLoading} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function EvidenceSummary({ request }: { request: OpenEvidenceInput | null }) {
  return (
    <section className="grid gap-2 rounded-lg border border-divider-subtle p-3">
      <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        <Trans>Obligation</Trans>
      </span>
      <div className="text-sm font-medium text-text-primary">
        {request?.label ?? <Trans>Selected obligation</Trans>}
      </div>
      {request ? (
        <div className="break-all font-mono text-xs text-text-tertiary">{request.obligationId}</div>
      ) : null}
    </section>
  )
}

function EvidenceTimeline({
  evidence,
  loading,
  focusEvidenceId,
}: {
  evidence: EvidencePublic[]
  loading: boolean
  focusEvidenceId: string | null
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Trans>Source timeline</Trans>
        </h3>
        <Badge variant="outline">{evidence.length}</Badge>
      </div>
      {loading ? (
        <div className="grid gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : evidence.length === 0 ? (
        <div className="rounded-lg border border-dashed border-divider-regular p-4 text-sm text-text-secondary">
          <Trans>No evidence linked yet</Trans>
        </div>
      ) : (
        <div className="grid gap-3">
          {evidence.map((item) => (
            <EvidenceCard key={item.id} item={item} focused={focusEvidenceId === item.id} />
          ))}
        </div>
      )}
    </section>
  )
}

function EvidenceCard({ item, focused }: { item: EvidencePublic; focused: boolean }) {
  const { t } = useLingui()
  return (
    <article
      className={
        focused
          ? 'grid gap-3 rounded-lg border border-state-accent-border bg-state-accent-hover p-3'
          : 'grid gap-3 rounded-lg border border-divider-subtle p-3'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline">{item.sourceType}</Badge>
        <span className="font-mono text-xs text-text-tertiary">
          {formatDateTimeWithTimezone(item.appliedAt)}
        </span>
      </div>
      <dl className="grid gap-2 text-sm">
        <EvidenceMetaRow label={t`Raw`} value={item.rawValue ?? t`Not recorded`} />
        <EvidenceMetaRow label={t`Normalized`} value={item.normalizedValue ?? t`Not recorded`} />
        <EvidenceMetaRow
          label={t`Confidence`}
          value={
            item.confidence === null ? t`Not recorded` : `${Math.round(item.confidence * 100)}%`
          }
        />
        <EvidenceMetaRow label={t`Model`} value={item.model ?? t`Deterministic`} />
      </dl>
      {item.verbatimQuote ? (
        <blockquote className="rounded-lg border-l-2 border-divider-deep bg-background-subtle px-3 py-2 text-sm text-text-secondary">
          {item.verbatimQuote}
        </blockquote>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {item.sourceId ? <Badge variant="secondary">{item.sourceId}</Badge> : null}
        {item.sourceUrl ? (
          <Button
            variant="ghost"
            size="sm"
            render={<a href={item.sourceUrl} target="_blank" rel="noreferrer" />}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            <Trans>Open source</Trans>
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function EvidenceMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{label}</dt>
      <dd className="break-words text-text-primary">{value}</dd>
    </div>
  )
}

function AuditTimeline({ events, loading }: { events: AuditEventPublic[]; loading: boolean }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Trans>Audit timeline</Trans>
        </h3>
        <Badge variant="outline">{events.length}</Badge>
      </div>
      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-divider-regular p-4 text-sm text-text-secondary">
          <Trans>No audit events recorded for this obligation.</Trans>
        </div>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="grid gap-2 rounded-lg border border-divider-subtle p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">{event.action}</Badge>
                <span className="font-mono text-xs text-text-tertiary">
                  {formatDateTimeWithTimezone(event.createdAt)}
                </span>
              </div>
              <pre className="max-h-36 overflow-auto rounded-md bg-background-subtle p-2 font-mono text-xs text-text-secondary">
                {JSON.stringify({ before: event.beforeJson, after: event.afterJson }, null, 2)}
              </pre>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
