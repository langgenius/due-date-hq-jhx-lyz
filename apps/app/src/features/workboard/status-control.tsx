import { useMemo } from 'react'
import { useLingui } from '@lingui/react/macro'

import type { ObligationInstancePublic, WorkboardRow } from '@duedatehq/contracts'
import { Badge, BadgeStatusDot } from '@duedatehq/ui/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'

type ObligationStatus = ObligationInstancePublic['status']
type StatusLabels = Record<ObligationStatus, string>

const ALL_STATUSES = [
  'pending',
  'in_progress',
  'review',
  'waiting_on_client',
  'done',
  'not_applicable',
] as const satisfies readonly ObligationStatus[]

const STATUS_VARIANT: Record<
  ObligationStatus,
  'destructive' | 'info' | 'secondary' | 'outline' | 'success' | 'warning'
> = {
  pending: 'secondary',
  in_progress: 'info',
  review: 'warning',
  waiting_on_client: 'outline',
  done: 'success',
  not_applicable: 'outline',
}

const STATUS_DOT: Record<
  ObligationStatus,
  'error' | 'normal' | 'disabled' | 'warning' | 'success'
> = {
  pending: 'disabled',
  in_progress: 'normal',
  review: 'warning',
  waiting_on_client: 'warning',
  done: 'success',
  not_applicable: 'disabled',
}

function isObligationStatus(value: string): value is ObligationStatus {
  return (ALL_STATUSES as readonly string[]).includes(value)
}

function useStatusLabels(): StatusLabels {
  const { t } = useLingui()
  return useMemo(
    () => ({
      pending: t`Pending`,
      in_progress: t`In progress`,
      review: t`In review`,
      waiting_on_client: t`Waiting on client`,
      done: t`Done`,
      not_applicable: t`Not applicable`,
    }),
    [t],
  )
}

function WorkboardStatusControl({
  row,
  labels,
  disabled,
  onChange,
}: {
  row: WorkboardRow
  labels: StatusLabels
  disabled: boolean
  onChange: (id: string, status: ObligationStatus) => void
}) {
  const { t } = useLingui()
  return (
    <div className="flex items-center gap-3">
      <Badge variant={STATUS_VARIANT[row.status]}>
        <BadgeStatusDot tone={STATUS_DOT[row.status]} />
        {labels[row.status]}
      </Badge>
      <Select
        value={row.status}
        onValueChange={(value) => {
          if (typeof value !== 'string' || !isObligationStatus(value)) return
          if (value === row.status) return
          onChange(row.id, value)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className="min-w-40"
          aria-label={t`Change status for ${row.clientName}`}
        >
          <SelectValue>{labels[row.status]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ALL_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {labels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export {
  ALL_STATUSES,
  WorkboardStatusControl,
  isObligationStatus,
  useStatusLabels,
  type ObligationStatus,
}
