import { EyeIcon } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'

import type { AuditEventPublic } from '@duedatehq/contracts'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'

import { shortenAuditId, summarizeAuditChange } from './audit-log-model'

function formatLocalDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function AuditLogTable({
  events,
  onOpenEvent,
}: {
  events: AuditEventPublic[]
  onOpenEvent: (id: string) => void
}) {
  const { t } = useLingui()

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
            <TableRow key={event.id} className="align-top">
              <TableCell className="font-mono text-xs tabular-nums">
                <div className="grid gap-1">
                  <span className="text-text-primary">{formatLocalDateTime(event.createdAt)}</span>
                  <span className="text-text-tertiary">{event.createdAt}</span>
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
                  {summarizeAuditChange(event)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t`View audit detail`}
                  onClick={() => onOpenEvent(event.id)}
                >
                  <EyeIcon />
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
