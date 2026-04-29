import { useState } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'

import type { AuditEventPublic } from '@duedatehq/contracts'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@duedatehq/ui/components/ui/sheet'

import {
  formatAuditJson,
  shortenAuditId,
  summarizeAuditChange,
  type AuditSummaryLabels,
} from './audit-log-model'

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium tracking-wider text-text-tertiary uppercase">{label}</dt>
      <dd className="break-all text-sm text-text-primary">{value}</dd>
    </div>
  )
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-medium tracking-wider text-text-tertiary uppercase">{label}</h3>
      <pre className="max-h-56 overflow-auto rounded-lg border border-divider-subtle bg-background-subtle p-3 font-mono text-xs leading-relaxed text-text-secondary">
        {formatAuditJson(value)}
      </pre>
    </section>
  )
}

export function AuditEventDrawer({
  event,
  open,
  onOpenChange,
}: {
  event: AuditEventPublic | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [renderedEvent, setRenderedEvent] = useState<AuditEventPublic | null>(event)

  if (event && renderedEvent !== event) {
    setRenderedEvent(event)
  }

  const detailEvent = event ?? renderedEvent

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[440px]">
        {detailEvent ? <AuditEventDrawerContent event={detailEvent} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function AuditEventDrawerContent({ event }: { event: AuditEventPublic }) {
  const { t } = useLingui()
  const summaryLabels: AuditSummaryLabels = {
    empty: t`empty`,
    object: t`object`,
    noPayload: t`No before/after payload`,
    created: t`Created snapshot`,
    beforeOnly: t`Before snapshot only`,
    noChange: t`No field-level change detected`,
  }
  const actor = event.actorLabel ?? event.actorId ?? t`System`
  const localTime = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(event.createdAt))

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          <Trans>Audit detail</Trans>
        </SheetTitle>
        <SheetDescription>{shortenAuditId(event.id)}</SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid gap-6">
          <section className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {event.action}
              </Badge>
              <Badge variant={event.actorId ? 'secondary' : 'outline'}>{actor}</Badge>
            </div>
            <p className="text-md text-text-primary">
              {summarizeAuditChange(event, summaryLabels)}
            </p>
          </section>

          <dl className="grid gap-4 rounded-lg border border-divider-subtle p-4">
            <MetadataRow label={t`Local time`} value={localTime} />
            <MetadataRow label={t`UTC time`} value={event.createdAt} />
            <MetadataRow label={t`Entity`} value={`${event.entityType} / ${event.entityId}`} />
            <MetadataRow label={t`Actor`} value={actor} />
            {event.reason ? <MetadataRow label={t`Reason`} value={event.reason} /> : null}
          </dl>

          <JsonBlock label={t`Before`} value={event.beforeJson} />
          <JsonBlock label={t`After`} value={event.afterJson} />

          <dl className="grid gap-4 rounded-lg border border-divider-subtle p-4">
            <MetadataRow label={t`IP hash`} value={event.ipHash ?? t`Not recorded`} />
            <MetadataRow
              label={t`User agent hash`}
              value={event.userAgentHash ?? t`Not recorded`}
            />
            <MetadataRow label={t`Firm id`} value={event.firmId} />
          </dl>
        </div>
      </div>
    </>
  )
}
