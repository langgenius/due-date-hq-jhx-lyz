import { type KeyboardEvent, type ReactNode, useMemo, type ComponentType } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileInputIcon,
  FileSearchIcon,
  MapPinnedIcon,
  SearchIcon,
  UsersRoundIcon,
} from 'lucide-react'

import type { ClientPublic } from '@duedatehq/contracts'
import { Badge, BadgeStatusDot } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@duedatehq/ui/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'

import { formatDate } from '@/lib/utils'

import {
  ALL_ENTITIES,
  CLIENT_ENTITY_TYPES,
  STATE_FILTER_ALL,
  getClientSourceType,
  type ClientEntityType,
  type ClientFactsModel,
  type ClientReadiness,
} from './client-readiness'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string
    cellClassName?: string
  }
}

type ClientMetric = {
  label: string
  value: string
  detail: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  tone: 'ready' | 'attention' | 'neutral'
}

type ClientFactsWorkspaceProps = {
  clients: ClientPublic[]
  filteredClients: ClientPublic[]
  activeClient: ClientPublic | null
  factsModel: ClientFactsModel
  entityLabels: Record<ClientEntityType, string>
  isLoading: boolean
  search: string
  entityFilter: string
  stateFilter: string
  onSearchChange: (value: string) => void
  onEntityFilterChange: (value: string | null) => void
  onStateFilterChange: (value: string | null) => void
  onSelectClient: (clientId: string) => void
  onImport: () => void
}

const metricToneClassName = {
  ready: 'bg-components-badge-bg-green-soft text-text-success',
  attention: 'bg-components-badge-bg-warning-soft text-text-warning',
  neutral: 'bg-background-section text-text-secondary',
} satisfies Record<ClientMetric['tone'], string>

export function ClientFactsWorkspace({
  clients,
  filteredClients,
  activeClient,
  factsModel,
  entityLabels,
  isLoading,
  search,
  entityFilter,
  stateFilter,
  onSearchChange,
  onEntityFilterChange,
  onStateFilterChange,
  onSelectClient,
  onImport,
}: ClientFactsWorkspaceProps) {
  const { t } = useLingui()
  const metrics = useMemo<ClientMetric[]>(
    () => [
      {
        label: t`Ready for rules`,
        value: String(factsModel.summary.readyForRules),
        detail: t`have jurisdiction facts`,
        icon: ClipboardCheckIcon,
        tone: 'ready',
      },
      {
        label: t`Needs facts`,
        value: String(factsModel.summary.needsFacts),
        detail: t`missing rule inputs`,
        icon: AlertTriangleIcon,
        tone: factsModel.summary.needsFacts > 0 ? 'attention' : 'neutral',
      },
      {
        label: t`Imported`,
        value: String(factsModel.summary.imported),
        detail: t`${factsModel.summary.manual} manual records`,
        icon: FileInputIcon,
        tone: 'neutral',
      },
      {
        label: t`States covered`,
        value: String(factsModel.summary.statesCovered),
        detail: t`for Pulse matching`,
        icon: MapPinnedIcon,
        tone: 'neutral',
      },
    ],
    [factsModel.summary, t],
  )

  const columns = useMemo<ColumnDef<ClientPublic>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t`Client`,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium text-text-primary">{row.original.name}</span>
            <span className="truncate text-xs text-text-tertiary">
              {row.original.email ?? t`No email`}
            </span>
          </div>
        ),
        meta: { cellClassName: 'min-w-[220px]' },
      },
      {
        id: 'readiness',
        header: t`Readiness`,
        cell: ({ row }) => (
          <ClientReadinessBadge
            readiness={factsModel.readinessById.get(row.original.id)}
            compact={false}
          />
        ),
      },
      {
        accessorKey: 'entityType',
        header: t`Entity`,
        cell: (info) => entityLabels[info.getValue<ClientEntityType>()],
      },
      {
        accessorKey: 'state',
        header: t`Jurisdiction`,
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {[row.original.state, row.original.county].filter(Boolean).join(' / ') || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'migrationBatchId',
        header: t`Source`,
        cell: ({ row }) => <ClientSourceBadge client={row.original} />,
      },
      {
        accessorKey: 'assigneeName',
        header: t`Owner`,
        cell: (info) => info.getValue<string | null>() ?? t`Unassigned`,
      },
      {
        accessorKey: 'updatedAt',
        header: t`Updated`,
        cell: (info) => (
          <span className="font-mono tabular-nums">{formatDate(info.getValue<string>())}</span>
        ),
      },
    ],
    [entityLabels, factsModel.readinessById, t],
  )

  const table = useReactTable({
    data: filteredClients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (client) => client.id,
  })

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? [0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24 w-full" />)
          : metrics.map((metric) => <ClientMetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <CardTitle>
                  <Trans>Client facts</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>
                    Search, segment, and inspect the facts that feed rules, risk, and Pulse
                    matching.
                  </Trans>
                </CardDescription>
              </div>
              <CardAction>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {filteredClients.length}/{clients.length}
                </Badge>
              </CardAction>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_140px]">
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={t`Search clients`}
                />
              </InputGroup>
              <Select value={entityFilter} onValueChange={onEntityFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL_ENTITIES}>
                      <Trans>All entities</Trans>
                    </SelectItem>
                    {CLIENT_ENTITY_TYPES.map((entityType) => (
                      <SelectItem key={entityType} value={entityType}>
                        {entityLabels[entityType]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={onStateFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={STATE_FILTER_ALL}>
                      <Trans>All states</Trans>
                    </SelectItem>
                    {factsModel.stateOptions.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ClientTableSkeleton />
            ) : filteredClients.length > 0 ? (
              <div className="overflow-hidden rounded-md border border-divider-regular">
                <Table className="table-fixed">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={header.column.columnDef.meta?.headerClassName}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={activeClient?.id === row.original.id ? 'selected' : undefined}
                        tabIndex={0}
                        className="cursor-pointer"
                        onClick={() => onSelectClient(row.original.id)}
                        onKeyDown={(event) =>
                          handleClientRowKeyDown(event, row.original.id, onSelectClient)
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cell.column.columnDef.meta?.cellClassName}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <ClientEmptyState hasClients={clients.length > 0} onImport={onImport} />
            )}
          </CardContent>
        </Card>

        <ClientDetailPanel
          client={activeClient}
          entityLabels={entityLabels}
          readiness={activeClient ? factsModel.readinessById.get(activeClient.id) : undefined}
        />
      </section>
    </>
  )
}

function handleClientRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  clientId: string,
  onSelectClient: (clientId: string) => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  onSelectClient(clientId)
}

function ClientMetricCard({ metric }: { metric: ClientMetric }) {
  const Icon = metric.icon
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">{metric.label}</span>
          <span className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
            {metric.value}
          </span>
          <span className="truncate text-xs text-text-tertiary">{metric.detail}</span>
        </div>
        <div
          className={`grid size-9 shrink-0 place-items-center rounded-md ${metricToneClassName[metric.tone]}`}
        >
          <Icon className="size-4" aria-hidden />
        </div>
      </CardContent>
    </Card>
  )
}

function ClientTableSkeleton() {
  return (
    <div className="grid gap-2">
      {[0, 1, 2, 3, 4].map((item) => (
        <Skeleton key={item} className="h-12 w-full" />
      ))}
    </div>
  )
}

function ClientEmptyState({ hasClients, onImport }: { hasClients: boolean; onImport: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-divider-regular p-6 text-center">
      <div className="grid size-10 place-items-center rounded-md bg-background-section text-text-secondary">
        <UsersRoundIcon className="size-5" aria-hidden />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">
          {hasClients ? (
            <Trans>No clients match these filters</Trans>
          ) : (
            <Trans>No clients yet</Trans>
          )}
        </p>
        <p className="text-sm text-text-tertiary">
          {hasClients ? (
            <Trans>Clear search or filters to return to the full firm directory.</Trans>
          ) : (
            <Trans>Import a CSV or create the first manual client record.</Trans>
          )}
        </p>
      </div>
      {!hasClients ? (
        <Button variant="outline" onClick={onImport}>
          <FileSearchIcon data-icon="inline-start" />
          <Trans>Run migration</Trans>
        </Button>
      ) : null}
    </div>
  )
}

function ClientDetailPanel({
  client,
  entityLabels,
  readiness,
}: {
  client: ClientPublic | null
  entityLabels: Record<ClientEntityType, string>
  readiness: ClientReadiness | undefined
}) {
  return (
    <Card className="xl:sticky xl:top-6">
      <CardHeader>
        <CardTitle>
          <Trans>Fact profile</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Read-only v1 profile from clients.listByFirm data.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {client ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-base font-semibold text-text-primary">
                  {client.name}
                </span>
                <span className="text-sm text-text-tertiary">
                  {entityLabels[client.entityType]}
                </span>
              </div>
              <ClientSourceBadge client={client} />
            </div>

            <div className="flex flex-wrap gap-2">
              <ClientReadinessBadge readiness={readiness} compact={false} />
              <Badge variant="outline" className="font-mono tabular-nums">
                {[client.state, client.county].filter(Boolean).join(' / ') || 'N/A'}
              </Badge>
            </div>

            <div className="grid gap-3">
              <DetailRow label={<Trans>EIN</Trans>} value={client.ein ?? 'N/A'} mono />
              <DetailRow label={<Trans>Email</Trans>} value={client.email ?? 'N/A'} />
              <DetailRow label={<Trans>Owner</Trans>} value={client.assigneeName ?? 'N/A'} />
              <DetailRow label={<Trans>Created</Trans>} value={formatDate(client.createdAt)} mono />
              <DetailRow label={<Trans>Updated</Trans>} value={formatDate(client.updatedAt)} mono />
            </div>

            <ClientFactChecklist client={client} readiness={readiness} />

            <div className="rounded-md border border-divider-regular bg-background-section p-3">
              <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                <Trans>Notes</Trans>
              </span>
              <p className="mt-2 text-sm text-text-secondary">
                {client.notes || <Trans>No notes.</Trans>}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-divider-regular p-6 text-center text-sm text-text-tertiary">
            <Trans>Select a client to inspect the record.</Trans>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ClientFactChecklist({
  client,
  readiness,
}: {
  client: ClientPublic
  readiness: ClientReadiness | undefined
}) {
  return (
    <div className="grid gap-2 rounded-md border border-divider-regular p-3">
      <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        <Trans>Fact readiness</Trans>
      </span>
      <FactCheckRow
        isComplete={!readiness?.missingRequiredFacts.includes('state')}
        label={<Trans>State jurisdiction</Trans>}
        detail={<Trans>Required for rules and Pulse matching.</Trans>}
      />
      <FactCheckRow
        isComplete={!readiness?.missingRequiredFacts.includes('entityType')}
        label={<Trans>Entity type</Trans>}
        detail={<Trans>Required for rule applicability.</Trans>}
      />
      <FactCheckRow
        isComplete={Boolean(client.ein)}
        label={<Trans>EIN</Trans>}
        detail={<Trans>Improves identity matching and audit review.</Trans>}
      />
      <FactCheckRow
        isComplete={Boolean(client.assigneeName)}
        label={<Trans>Owner</Trans>}
        detail={<Trans>Keeps workboard follow-up accountable.</Trans>}
      />
    </div>
  )
}

function FactCheckRow({
  isComplete,
  label,
  detail,
}: {
  isComplete: boolean
  label: ReactNode
  detail: ReactNode
}) {
  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-2">
      {isComplete ? (
        <CheckCircle2Icon className="mt-0.5 size-4 text-text-success" aria-hidden />
      ) : (
        <AlertTriangleIcon className="mt-0.5 size-4 text-text-warning" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary">{detail}</p>
      </div>
    </div>
  )
}

function ClientReadinessBadge({
  readiness,
  compact,
}: {
  readiness: ClientReadiness | undefined
  compact: boolean
}) {
  if (readiness?.status === 'needs_facts') {
    return (
      <Badge variant="warning">
        <BadgeStatusDot tone="warning" />
        {compact ? <Trans>Needs facts</Trans> : <MissingFactsLabel readiness={readiness} />}
      </Badge>
    )
  }

  return (
    <Badge variant="success">
      <BadgeStatusDot tone="success" />
      <Trans>Ready for rules</Trans>
    </Badge>
  )
}

function MissingFactsLabel({ readiness }: { readiness: ClientReadiness }) {
  if (readiness.missingRequiredFacts.includes('state')) {
    return <Trans>Needs state</Trans>
  }
  return <Trans>Needs facts</Trans>
}

function ClientSourceBadge({ client }: { client: ClientPublic }) {
  return getClientSourceType(client) === 'imported' ? (
    <Badge variant="info">
      <BadgeStatusDot tone="normal" />
      <Trans>Imported</Trans>
    </Badge>
  ) : (
    <Badge variant="outline">
      <Trans>Manual</Trans>
    </Badge>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: ReactNode
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
      <span className="text-text-tertiary">{label}</span>
      <span className={mono ? 'font-mono tabular-nums text-text-primary' : 'text-text-primary'}>
        {value}
      </span>
    </div>
  )
}
