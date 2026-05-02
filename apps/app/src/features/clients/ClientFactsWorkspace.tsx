import {
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
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
  PanelRightOpenIcon,
  UsersRoundIcon,
} from 'lucide-react'

import type { ClientPublic } from '@duedatehq/contracts'
import { Badge, BadgeStatusDot } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@duedatehq/ui/components/ui/sheet'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'

import {
  TableHeaderMultiFilter,
  type TableFilterOption,
} from '@/components/patterns/table-header-filter'
import { formatDateTimeWithTimezone } from '@/lib/utils'

import {
  CLIENT_ENTITY_TYPES,
  CLIENT_READINESS_FILTERS,
  CLIENT_SOURCE_FILTERS,
  CLIENT_UNASSIGNED_OWNER_FILTER,
  getClientSourceType,
  type ClientEntityType,
  type ClientFactsModel,
  type ClientReadiness,
  type ClientReadinessStatus,
  type ClientSourceType,
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

type FilterOption = TableFilterOption

type ClientFactsWorkspaceProps = {
  clients: ClientPublic[]
  filteredClients: ClientPublic[]
  activeClient: ClientPublic | null
  factsModel: ClientFactsModel
  entityLabels: Record<ClientEntityType, string>
  isLoading: boolean
  clientFilter: string[]
  entityFilter: ClientEntityType[]
  stateFilter: string[]
  readinessFilter: ClientReadinessStatus[]
  sourceFilter: ClientSourceType[]
  ownerFilter: string[]
  profileOpen: boolean
  onClientFilterChange: (value: string[]) => void
  onEntityFilterChange: (value: string[]) => void
  onStateFilterChange: (value: string[]) => void
  onReadinessFilterChange: (value: string[]) => void
  onSourceFilterChange: (value: string[]) => void
  onOwnerFilterChange: (value: string[]) => void
  onSelectClient: (clientId: string) => void
  onProfileOpenChange: (open: boolean) => void
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
  clientFilter,
  entityFilter,
  stateFilter,
  readinessFilter,
  sourceFilter,
  ownerFilter,
  profileOpen,
  onClientFilterChange,
  onEntityFilterChange,
  onStateFilterChange,
  onReadinessFilterChange,
  onSourceFilterChange,
  onOwnerFilterChange,
  onSelectClient,
  onProfileOpenChange,
  onImport,
}: ClientFactsWorkspaceProps) {
  const { t } = useLingui()
  const [openHeaderFilter, setOpenHeaderFilter] = useState<string | null>(null)
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
  const readinessLabels = useMemo<Record<ClientReadinessStatus, string>>(
    () => ({
      ready: t`Ready for rules`,
      needs_facts: t`Needs facts`,
    }),
    [t],
  )
  const sourceLabels = useMemo<Record<ClientSourceType, string>>(
    () => ({
      imported: t`Imported`,
      manual: t`Manual`,
    }),
    [t],
  )
  const clientOptions = useMemo<FilterOption[]>(
    () =>
      clients
        .map((client) => ({ value: client.id, label: client.name }))
        .toSorted((a, b) => a.label.localeCompare(b.label)),
    [clients],
  )
  const readinessOptions = useMemo<FilterOption[]>(
    () =>
      CLIENT_READINESS_FILTERS.map((status) => ({
        value: status,
        label: readinessLabels[status],
        count:
          status === 'ready' ? factsModel.summary.readyForRules : factsModel.summary.needsFacts,
      })).filter((option) => option.count > 0),
    [factsModel.summary.needsFacts, factsModel.summary.readyForRules, readinessLabels],
  )
  const entityOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<ClientEntityType, number>()
    for (const client of clients) {
      counts.set(client.entityType, (counts.get(client.entityType) ?? 0) + 1)
    }
    return CLIENT_ENTITY_TYPES.map((entityType) => ({
      value: entityType,
      label: entityLabels[entityType],
      count: counts.get(entityType) ?? 0,
    })).filter((option) => option.count > 0)
  }, [clients, entityLabels])
  const stateOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>()
    for (const client of clients) {
      if (client.state) counts.set(client.state, (counts.get(client.state) ?? 0) + 1)
    }
    return factsModel.stateOptions.map((state) => ({
      value: state,
      label: state,
      count: counts.get(state) ?? 0,
    }))
  }, [clients, factsModel.stateOptions])
  const sourceOptions = useMemo<FilterOption[]>(
    () =>
      CLIENT_SOURCE_FILTERS.map((source) => ({
        value: source,
        label: sourceLabels[source],
        count: source === 'imported' ? factsModel.summary.imported : factsModel.summary.manual,
      })).filter((option) => option.count > 0),
    [factsModel.summary.imported, factsModel.summary.manual, sourceLabels],
  )
  const ownerOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>()
    const labels = new Map<string, string>()
    for (const client of clients) {
      const value = client.assigneeName ?? CLIENT_UNASSIGNED_OWNER_FILTER
      counts.set(value, (counts.get(value) ?? 0) + 1)
      labels.set(value, client.assigneeName ?? t`Unassigned`)
    }
    return [...counts.entries()]
      .map(([value, count]) => ({
        value,
        label: labels.get(value) ?? value,
        count,
      }))
      .toSorted((a, b) => {
        if (a.value === CLIENT_UNASSIGNED_OWNER_FILTER) return -1
        if (b.value === CLIENT_UNASSIGNED_OWNER_FILTER) return 1
        return a.label.localeCompare(b.label)
      })
  }, [clients, t])
  const setHeaderFilterOpen = useCallback((filterId: string, nextOpen: boolean) => {
    setOpenHeaderFilter((current) => (nextOpen ? filterId : current === filterId ? null : current))
  }, [])

  const columns = useMemo<ColumnDef<ClientPublic>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Client`}
            open={openHeaderFilter === 'client'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('client', nextOpen)}
            options={clientOptions}
            selected={clientFilter}
            emptyLabel={t`No clients`}
            searchable
            searchPlaceholder={t`Search clients`}
            onSelectedChange={onClientFilterChange}
          />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium text-text-primary">{row.original.name}</span>
            <span className="truncate text-xs text-text-tertiary">
              {row.original.email ?? t`No email`}
            </span>
          </div>
        ),
        meta: {
          headerClassName: 'w-[300px]',
          cellClassName: 'w-[300px] min-w-[260px]',
        },
      },
      {
        id: 'readiness',
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Readiness`}
            open={openHeaderFilter === 'readiness'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('readiness', nextOpen)}
            options={readinessOptions}
            selected={readinessFilter}
            emptyLabel={t`No readiness states`}
            onSelectedChange={onReadinessFilterChange}
          />
        ),
        cell: ({ row }) => (
          <ClientReadinessBadge
            readiness={factsModel.readinessById.get(row.original.id)}
            compact={false}
          />
        ),
        meta: {
          headerClassName: 'w-[170px]',
          cellClassName: 'w-[170px]',
        },
      },
      {
        accessorKey: 'entityType',
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Entity`}
            open={openHeaderFilter === 'entity'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('entity', nextOpen)}
            options={entityOptions}
            selected={entityFilter}
            emptyLabel={t`No entities`}
            onSelectedChange={onEntityFilterChange}
          />
        ),
        cell: (info) => entityLabels[info.getValue<ClientEntityType>()],
        meta: {
          headerClassName: 'w-[150px]',
          cellClassName: 'w-[150px]',
        },
      },
      {
        accessorKey: 'state',
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Jurisdiction`}
            open={openHeaderFilter === 'state'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('state', nextOpen)}
            options={stateOptions}
            selected={stateFilter}
            emptyLabel={t`No states`}
            onSelectedChange={onStateFilterChange}
          />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono tabular-nums">
            {[row.original.state, row.original.county].filter(Boolean).join(' / ') || 'N/A'}
          </span>
        ),
        meta: {
          headerClassName: 'w-[210px]',
          cellClassName: 'w-[210px]',
        },
      },
      {
        accessorKey: 'migrationBatchId',
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Source`}
            open={openHeaderFilter === 'source'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('source', nextOpen)}
            options={sourceOptions}
            selected={sourceFilter}
            emptyLabel={t`No source types`}
            onSelectedChange={onSourceFilterChange}
          />
        ),
        cell: ({ row }) => <ClientSourceBadge client={row.original} />,
        meta: {
          headerClassName: 'w-[130px]',
          cellClassName: 'w-[130px]',
        },
      },
      {
        accessorKey: 'assigneeName',
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Owner`}
            open={openHeaderFilter === 'owner'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('owner', nextOpen)}
            options={ownerOptions}
            selected={ownerFilter}
            emptyLabel={t`No owners`}
            searchable
            searchPlaceholder={t`Search owners`}
            onSelectedChange={onOwnerFilterChange}
          />
        ),
        cell: (info) => info.getValue<string | null>() ?? t`Unassigned`,
        meta: {
          headerClassName: 'w-[170px]',
          cellClassName: 'w-[170px]',
        },
      },
      {
        accessorKey: 'updatedAt',
        header: t`Updated`,
        cell: (info) => (
          <span className="font-mono tabular-nums">
            {formatDateTimeWithTimezone(info.getValue<string>())}
          </span>
        ),
        meta: {
          headerClassName: 'w-[230px]',
          cellClassName: 'w-[230px] whitespace-nowrap',
        },
      },
    ],
    [
      clientFilter,
      clientOptions,
      entityFilter,
      entityLabels,
      entityOptions,
      factsModel.readinessById,
      onClientFilterChange,
      onEntityFilterChange,
      onOwnerFilterChange,
      onReadinessFilterChange,
      onSourceFilterChange,
      onStateFilterChange,
      openHeaderFilter,
      ownerFilter,
      ownerOptions,
      readinessFilter,
      readinessOptions,
      setHeaderFilterOpen,
      sourceFilter,
      sourceOptions,
      stateFilter,
      stateOptions,
      t,
    ],
  )

  const table = useReactTable({
    data: filteredClients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (client) => client.id,
  })
  const handleOpenClientProfile = useCallback(
    (clientId: string) => {
      onSelectClient(clientId)
      onProfileOpenChange(true)
    },
    [onProfileOpenChange, onSelectClient],
  )

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? [0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24 w-full" />)
          : metrics.map((metric) => <ClientMetricCard key={metric.label} metric={metric} />)}
      </section>

      <section>
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
              <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:max-w-[880px] xl:shrink-0 xl:justify-end">
                <Badge variant="outline" className="font-mono tabular-nums">
                  {filteredClients.length}/{clients.length}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!activeClient}
                  onClick={() => onProfileOpenChange(true)}
                >
                  <PanelRightOpenIcon data-icon="inline-start" />
                  <Trans>Fact profile</Trans>
                </Button>
                <TableHeaderMultiFilter
                  label={t`Client`}
                  options={clientOptions}
                  selected={clientFilter}
                  disabled={isLoading}
                  emptyLabel={t`No clients`}
                  searchable
                  searchPlaceholder={t`Search clients`}
                  onSelectedChange={onClientFilterChange}
                />
                <TableHeaderMultiFilter
                  label={t`Entity`}
                  options={entityOptions}
                  selected={entityFilter}
                  disabled={isLoading}
                  emptyLabel={t`No entities`}
                  onSelectedChange={onEntityFilterChange}
                />
                <TableHeaderMultiFilter
                  label={t`State`}
                  options={stateOptions}
                  selected={stateFilter}
                  disabled={isLoading}
                  emptyLabel={t`No states`}
                  onSelectedChange={onStateFilterChange}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ClientTableSkeleton />
            ) : clients.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-divider-regular">
                <Table className="min-w-[1280px] table-fixed">
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
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={activeClient?.id === row.original.id ? 'selected' : undefined}
                          role="button"
                          tabIndex={0}
                          aria-label={t`Open fact profile for ${row.original.name}`}
                          className="cursor-pointer outline-none hover:bg-state-base-hover focus-visible:bg-state-base-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt focus-visible:ring-inset"
                          onClick={() => handleOpenClientProfile(row.original.id)}
                          onKeyDown={(event) =>
                            handleClientRowKeyDown(event, row.original.id, handleOpenClientProfile)
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
                      ))
                    ) : (
                      <ClientTableEmptyRow colSpan={table.getAllLeafColumns().length} />
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <ClientEmptyState hasClients={false} onImport={onImport} />
            )}
          </CardContent>
        </Card>

        <ClientProfileSheet
          open={profileOpen}
          onOpenChange={onProfileOpenChange}
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
    <Card role="group" aria-label={metric.label}>
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

function ClientTableEmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center gap-1 text-xs">
          <span className="font-medium text-text-primary">
            <Trans>No clients match these filters</Trans>
          </span>
          <span className="text-text-tertiary">
            <Trans>Clear search or filters to return to the full practice directory.</Trans>
          </span>
        </div>
      </TableCell>
    </TableRow>
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
            <Trans>Clear search or filters to return to the full practice directory.</Trans>
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

function ClientProfileSheet({
  open,
  onOpenChange,
  client,
  entityLabels,
  readiness,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientPublic | null
  entityLabels: Record<ClientEntityType, string>
  readiness: ClientReadiness | undefined
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-[100vw] gap-0 overflow-hidden p-0 sm:max-w-[420px]"
      >
        <SheetHeader className="border-b border-divider-subtle px-5 py-4">
          <SheetTitle className="text-md">
            <Trans>Fact profile</Trans>
          </SheetTitle>
          <SheetDescription>
            <Trans>Read-only v1 profile from practice client data.</Trans>
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
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
                <DetailRow
                  label={<Trans>Created</Trans>}
                  value={formatDateTimeWithTimezone(client.createdAt)}
                  mono
                />
                <DetailRow
                  label={<Trans>Updated</Trans>}
                  value={formatDateTimeWithTimezone(client.updatedAt)}
                  mono
                />
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
        </div>
      </SheetContent>
    </Sheet>
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
      <Badge variant="warning" className="text-xs">
        <BadgeStatusDot tone="warning" />
        {compact ? <Trans>Needs facts</Trans> : <MissingFactsLabel readiness={readiness} />}
      </Badge>
    )
  }

  return (
    <Badge variant="success" className="text-xs">
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
    <Badge variant="info" className="text-xs">
      <BadgeStatusDot tone="normal" />
      <Trans>Imported</Trans>
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs">
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
