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
import { formatDateTimeWithTimezone } from '@/lib/utils'

import {
  formatAuditJson,
  formatAuditActionLabel,
  formatAuditEntityTypeLabel,
  getAuditEntityDisplay,
  shortenAuditId,
  summarizeAuditChange,
  type AuditSummaryLabels,
} from './audit-log-model'
import { useAuditActionLabels, useAuditEntityTypeLabels } from './audit-log-labels'

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium tracking-wider text-text-tertiary uppercase">{label}</dt>
      <dd className="break-all text-sm text-text-primary">{value}</dd>
    </div>
  )
}

function JsonBlock({
  label,
  value,
  firmTimezone,
}: {
  label: string
  value: unknown
  firmTimezone?: string
}) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-medium tracking-wider text-text-tertiary uppercase">{label}</h3>
      <pre className="max-h-56 overflow-auto rounded-lg border border-divider-subtle bg-background-subtle p-3 font-mono text-xs leading-relaxed text-text-secondary">
        {formatAuditJson(value, firmTimezone)}
      </pre>
    </section>
  )
}

export function AuditEventDrawer({
  event,
  firmTimezone,
  open,
  onOpenChange,
}: {
  event: AuditEventPublic | null
  firmTimezone: string
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
        {detailEvent ? (
          <AuditEventDrawerContent event={detailEvent} firmTimezone={firmTimezone} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function AuditEventDrawerContent({
  event,
  firmTimezone,
}: {
  event: AuditEventPublic
  firmTimezone: string
}) {
  const { t } = useLingui()
  const actionLabels = useAuditActionLabels()
  const entityTypeLabels = useAuditEntityTypeLabels()
  const summaryLabels: AuditSummaryLabels = {
    empty: t`empty`,
    object: t`object`,
    noPayload: t`No before/after payload`,
    created: t`Created snapshot`,
    beforeOnly: t`Before snapshot only`,
    noChange: t`No field-level change detected`,
  }
  const actor = event.actorLabel ?? event.actorId ?? t`System`
  const actionLabel = formatAuditActionLabel(event.action, actionLabels)
  const entityTypeLabel = formatAuditEntityTypeLabel(event.entityType, entityTypeLabels)
  const entityDisplay = getAuditEntityDisplay(event, entityTypeLabel)
  const firmTime = formatDateTimeWithTimezone(event.createdAt, firmTimezone)
  const utcTime = formatDateTimeWithTimezone(event.createdAt, 'UTC')

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
              <Badge variant="outline">{actionLabel}</Badge>
              <Badge variant={event.actorId ? 'secondary' : 'outline'}>{actor}</Badge>
            </div>
            <p className="text-md text-text-primary">
              {summarizeAuditChange(event, summaryLabels, firmTimezone)}
            </p>
          </section>

          <dl className="grid gap-4 rounded-lg border border-divider-subtle p-4">
            <MetadataRow label={t`Firm time`} value={firmTime} />
            <MetadataRow label={t`UTC time`} value={utcTime} />
            <MetadataRow label={t`Entity`} value={entityDisplay.primary} />
            <MetadataRow label={t`Entity type`} value={entityTypeLabel} />
            <MetadataRow label={t`Entity id`} value={shortenAuditId(event.entityId)} />
            <MetadataRow label={t`Actor`} value={actor} />
            {event.reason ? <MetadataRow label={t`Reason`} value={event.reason} /> : null}
          </dl>

          <JsonBlock label={t`Before`} value={event.beforeJson} firmTimezone={firmTimezone} />
          <JsonBlock label={t`After`} value={event.afterJson} firmTimezone={firmTimezone} />

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
