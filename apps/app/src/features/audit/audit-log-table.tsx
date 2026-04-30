import { type KeyboardEvent, useCallback } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'

import type { AuditEventPublic } from '@duedatehq/contracts'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { formatDateTimeWithTimezone } from '@/lib/utils'

import { shortenAuditId, summarizeAuditChange, type AuditSummaryLabels } from './audit-log-model'

export function AuditLogTable({
  events,
  onOpenEvent,
}: {
  events: AuditEventPublic[]
  onOpenEvent: (id: string) => void
}) {
  const { t } = useLingui()
  const summaryLabels: AuditSummaryLabels = {
    empty: t`empty`,
    object: t`object`,
    noPayload: t`No before/after payload`,
    created: t`Created snapshot`,
    beforeOnly: t`Before snapshot only`,
    noChange: t`No field-level change detected`,
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Trans>Time</Trans>
          </TableHead>
          <TableHead>
            <Trans>Actor</Trans>
          </TableHead>
          <TableHead>
            <Trans>Action</Trans>
          </TableHead>
          <TableHead>
            <Trans>Entity</Trans>
          </TableHead>
          <TableHead>
            <Trans>Change</Trans>
          </TableHead>
          <TableHead className="text-right">
            <Trans>Detail</Trans>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const actor = event.actorLabel ?? event.actorId ?? t`System`
          return (
            <AuditLogRow
              key={event.id}
              event={event}
              actor={actor}
              summaryLabels={summaryLabels}
              onOpenEvent={onOpenEvent}
            />
          )
        })}
      </TableBody>
    </Table>
  )
}

function AuditLogRow({
  event,
  actor,
  summaryLabels,
  onOpenEvent,
}: {
  event: AuditEventPublic
  actor: string
  summaryLabels: AuditSummaryLabels
  onOpenEvent: (id: string) => void
}) {
  const { t } = useLingui()
  const handleClick = useCallback(() => onOpenEvent(event.id), [event.id, onOpenEvent])
  const handleKeyDown = useCallback(
    (keyboardEvent: KeyboardEvent<HTMLTableRowElement>) => {
      if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
        keyboardEvent.preventDefault()
        onOpenEvent(event.id)
      }
    },
    [event.id, onOpenEvent],
  )

  return (
    <TableRow
      role="button"
      tabIndex={0}
      aria-label={t`View audit detail`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer align-top outline-none hover:bg-state-base-hover focus-visible:bg-state-base-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt focus-visible:ring-inset"
    >
      <TableCell className="font-mono text-xs tabular-nums">
        <div className="grid gap-1">
          <span className="text-text-primary">{formatDateTimeWithTimezone(event.createdAt)}</span>
          <span className="text-text-tertiary">
            {formatDateTimeWithTimezone(event.createdAt, 'UTC')}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="text-sm font-medium text-text-primary">{actor}</span>
          {event.actorId ? (
            <span className="font-mono text-xs text-text-tertiary">
              {shortenAuditId(event.actorId)}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono">
          {event.action}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="text-sm text-text-primary">{event.entityType}</span>
          <span className="font-mono text-xs text-text-tertiary">
            {shortenAuditId(event.entityId)}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-[360px] whitespace-normal">
        <span className="line-clamp-2 text-sm text-text-secondary">
          {summarizeAuditChange(event, summaryLabels)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="text-sm text-text-tertiary" aria-hidden>
          ›
        </span>
      </TableCell>
    </TableRow>
  )
}
