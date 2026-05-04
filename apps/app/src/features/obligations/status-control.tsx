import { useMemo } from 'react'
import { useLingui } from '@lingui/react/macro'

import type { ObligationInstancePublic, ObligationQueueRow } from '@duedatehq/contracts'
import { BadgeStatusDot, badgeVariants } from '@duedatehq/ui/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@duedatehq/ui/components/ui/dropdown-menu'
import { cn } from '@duedatehq/ui/lib/utils'

type ObligationStatus = ObligationInstancePublic['status']
type ObligationReadiness = ObligationInstancePublic['readiness']
type StatusLabels = Record<ObligationStatus, string>
type ReadinessLabels = Record<ObligationReadiness, string>
type StatusControlRow = Pick<ObligationQueueRow, 'clientName' | 'status'> & { id: string }

const ALL_STATUSES = [
  'pending',
  'in_progress',
  'waiting_on_client',
  'review',
  'done',
  'paid',
  'extended',
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
  extended: 'info',
  paid: 'success',
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
  extended: 'normal',
  paid: 'success',
  not_applicable: 'disabled',
}

function isObligationStatus(value: string): value is ObligationStatus {
  return (ALL_STATUSES as readonly string[]).includes(value)
}

function useStatusLabels(): StatusLabels {
  const { t } = useLingui()
  return useMemo(
    () => ({
      pending: t`Not started`,
      in_progress: t`In progress`,
      waiting_on_client: t`Waiting on client`,
      review: t`Needs review`,
      done: t`Filed`,
      paid: t`Paid`,
      extended: t`Extended`,
      not_applicable: t`Not applicable`,
    }),
    [t],
  )
}

function useReadinessLabels(): ReadinessLabels {
  const { t } = useLingui()
  return useMemo(
    () => ({
      ready: t`Ready`,
      waiting: t`Waiting`,
      needs_review: t`Needs review`,
    }),
    [t],
  )
}

function ObligationQueueStatusControl({
  row,
  labels,
  disabled,
  onChange,
}: {
  row: StatusControlRow
  labels: StatusLabels
  disabled: boolean
  onChange: (id: string, status: ObligationStatus) => void
}) {
  const { t } = useLingui()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t`Change status for ${row.clientName}`}
            disabled={disabled}
            className={cn(
              badgeVariants({ variant: STATUS_VARIANT[row.status] }),
              'h-6 cursor-pointer text-xs outline-none hover:ring-2 hover:ring-state-accent-active-alt focus-visible:ring-2 focus-visible:ring-state-accent-active-alt disabled:cursor-not-allowed disabled:opacity-50',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <BadgeStatusDot tone={STATUS_DOT[row.status]} />
            {labels[row.status]}
          </button>
        }
      />
      <DropdownMenuContent className="min-w-48" align="start">
        <DropdownMenuRadioGroup
          value={row.status}
          onValueChange={(value) => {
            if (typeof value !== 'string' || !isObligationStatus(value)) return
            if (value === row.status) return
            onChange(row.id, value)
          }}
        >
          {ALL_STATUSES.map((status) => (
            <DropdownMenuRadioItem
              key={status}
              value={status}
              className="gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              <BadgeStatusDot tone={STATUS_DOT[status]} />
              <span>{labels[status]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export {
  ALL_STATUSES,
  ObligationQueueStatusControl,
  isObligationStatus,
  useReadinessLabels,
  useStatusLabels,
  type ObligationReadiness,
  type ObligationStatus,
}
