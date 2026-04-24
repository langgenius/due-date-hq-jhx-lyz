import { FilterIcon, SearchIcon } from 'lucide-react'
import { Plural, Trans, useLingui } from '@lingui/react/macro'

import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import { Input } from '@duedatehq/ui/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { formatCents, formatDate } from '@/lib/utils'

const obligations = [
  ['Arbor & Vale LLC', '1065 extension', '2026-03-15', 'blocked', 1840000, 'M. Chen'],
  ['Northstar Dental Group', 'Payroll deposit', '2026-03-18', 'in review', 912500, 'A. Rivera'],
  ['Copperline Studios', 'Sales tax', '2026-03-20', 'draft', 238900, 'K. Patel'],
  ['Lake Union Foods', '1099 correction', '2026-03-22', 'waiting', 94000, 'D. Brooks'],
  ['Westbridge GP', 'Basis workpaper', '2026-03-25', 'in review', 620000, 'M. Chen'],
  ['Hale Robotics Inc.', 'R&D support', '2026-03-28', 'draft', 305000, 'S. Imani'],
  ['Summit Care Partners', 'ACA review', '2026-03-31', 'waiting', 172000, 'K. Patel'],
  ['Bluegrain Imports', 'Duty accrual', '2026-04-02', 'in review', 746000, 'A. Rivera'],
  ['Juniper Advisory', 'State composite return', '2026-04-04', 'draft', 141000, 'S. Imani'],
  ['Redwood Clinics', 'Extension consent', '2026-04-07', 'waiting', 86000, 'D. Brooks'],
  ['Beacon Supply Co.', 'Nexus review', '2026-04-10', 'draft', 412000, 'K. Patel'],
  ['Union Park Labs', 'Credit memo', '2026-04-12', 'filed', 0, 'M. Chen'],
] as const

const statusClass = {
  blocked: 'border-severity-critical-border bg-severity-critical-tint text-severity-critical',
  'in review': 'border-border-default bg-accent text-accent-foreground',
  draft: 'border-border-default bg-secondary text-secondary-foreground',
  waiting: 'border-border-default bg-bg-panel text-text-secondary',
  filed: 'border-border-default bg-bg-subtle text-status-done',
}

type ObligationStatus = keyof typeof statusClass
type FilterKey = 'all' | 'blocked' | 'in review' | 'waiting'

function useStatusLabels(): Record<ObligationStatus, string> {
  const { t } = useLingui()
  return {
    blocked: t`blocked`,
    'in review': t`in review`,
    draft: t`draft`,
    waiting: t`waiting`,
    filed: t`filed`,
  }
}

function useFilterLabels(): Record<FilterKey, string> {
  const { t } = useLingui()
  return {
    all: t`all`,
    blocked: t`blocked`,
    'in review': t`in review`,
    waiting: t`waiting`,
  }
}

export function WorkboardRoute() {
  const { t } = useLingui()
  const statusLabels = useStatusLabels()
  const filterLabels = useFilterLabels()
  const filters: FilterKey[] = ['all', 'blocked', 'in review', 'waiting']
  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          <Trans>Workboard</Trans>
        </span>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              <Trans>Obligation queue</Trans>
            </h1>
            <p className="max-w-[720px] text-sm text-text-secondary">
              <Trans>
                A first pass at the dense operational surface: filters, search, status and source
                scanning are visible before API wiring.
              </Trans>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FilterIcon data-icon="inline-start" />
              <Trans>Filters</Trans>
            </Button>
            <Button size="sm">
              <Trans>Assign selected</Trans>
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader>
          <CardTitle>
            <Trans>Queue controls</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Static UI now; URL-backed filters can replace this shell later.</Trans>
          </CardDescription>
          <CardAction>
            <Badge variant="outline" className="font-mono tabular-nums">
              <Plural value={obligations.length} one="# row" other="# rows" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-[360px]">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t`Search obligations`}
                className="pl-8"
                placeholder={t`Search clients or obligations`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Badge key={filter} variant={filter === 'all' ? 'default' : 'outline'}>
                  {filterLabels[filter]}
                </Badge>
              ))}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t`Client`}</TableHead>
                <TableHead>{t`Obligation`}</TableHead>
                <TableHead>{t`Deadline`}</TableHead>
                <TableHead>{t`Status`}</TableHead>
                <TableHead>{t`Exposure`}</TableHead>
                <TableHead>{t`Assignee`}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.map(([client, obligation, deadline, status, exposure, assignee]) => (
                <TableRow key={`${client}-${obligation}`}>
                  <TableCell className="font-medium">{client}</TableCell>
                  <TableCell className="text-text-secondary">{obligation}</TableCell>
                  <TableCell className="font-mono tabular-nums">{formatDate(deadline)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClass[status]}>
                      {statusLabels[status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{formatCents(exposure)}</TableCell>
                  <TableCell>{assignee}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
