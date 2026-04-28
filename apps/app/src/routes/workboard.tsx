import { useCallback, useDeferredValue, useMemo } from 'react'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FilterIcon, SearchIcon } from 'lucide-react'
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { toast } from 'sonner'

import type { ObligationInstancePublic, WorkboardRow, WorkboardSort } from '@duedatehq/contracts'
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
import { Input } from '@duedatehq/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'

import {
  isInteractiveEventTarget,
  useAppHotkey,
  useKeyboardShortcutsBlocked,
} from '@/components/patterns/keyboard-shell'
import { useMigrationWizard } from '@/features/migration/WizardProvider'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'
import { formatDate } from '@/lib/utils'

type ObligationStatus = ObligationInstancePublic['status']
type WorkboardColumnMeta = {
  headerClassName?: string
  cellClassName?: string
}

const ALL_STATUSES = [
  'pending',
  'in_progress',
  'review',
  'waiting_on_client',
  'done',
  'not_applicable',
] as const satisfies readonly ObligationStatus[]

const ALL_SORTS = [
  'due_asc',
  'due_desc',
  'updated_desc',
] as const satisfies readonly WorkboardSort[]
const DEFAULT_SORT: WorkboardSort = 'due_asc'
const EMPTY_WORKBOARD_ROWS: WorkboardRow[] = []
const PAGE_SIZE = 50

const workboardQueryParsers = {
  q: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsStringLiteral(ALL_STATUSES)).withDefault([]),
  sort: parseAsStringLiteral(ALL_SORTS).withDefault(DEFAULT_SORT),
  cursor: parseAsString,
  row: parseAsString,
}

function isObligationStatus(value: string): value is ObligationStatus {
  return (ALL_STATUSES as readonly string[]).includes(value)
}

function isWorkboardSort(value: string): value is WorkboardSort {
  return (ALL_SORTS as readonly string[]).includes(value)
}

// Status → soft chip variant + halo dot tone. One central map keeps the
// Workboard, Dashboard, and Audit drawers visually consistent.
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

function useStatusLabels(): Record<ObligationStatus, string> {
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

function useSortLabels(): Record<WorkboardSort, string> {
  const { t } = useLingui()
  return useMemo(
    () => ({
      due_asc: t`Due date — earliest first`,
      due_desc: t`Due date — latest first`,
      updated_desc: t`Recently updated`,
    }),
    [t],
  )
}

function getSortingState(sort: WorkboardSort): SortingState {
  if (sort === 'due_desc') return [{ id: 'currentDueDate', desc: true }]
  if (sort === 'updated_desc') return [{ id: 'updatedAt', desc: true }]
  return [{ id: 'currentDueDate', desc: false }]
}

function withDefaultSortCleared(sort: WorkboardSort): WorkboardSort | null {
  return sort === DEFAULT_SORT ? null : sort
}

function columnMeta(column: ColumnDef<WorkboardRow>): WorkboardColumnMeta {
  return (column.meta ?? {}) as WorkboardColumnMeta
}

export function WorkboardRoute() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const { openWizard } = useMigrationWizard()
  const shortcutsBlocked = useKeyboardShortcutsBlocked()
  const statusLabels = useStatusLabels()
  const sortLabels = useSortLabels()
  const [{ q: searchInput, status: statusFilter, sort, cursor, row }, setWorkboardQuery] =
    useQueryStates(workboardQueryParsers, { history: 'replace' })

  const deferredSearch = useDeferredValue(searchInput.trim())
  const sorting = useMemo(() => getSortingState(sort), [sort])
  const statusQuery = useMemo(() => [...statusFilter], [statusFilter])

  const queryInput = useMemo(
    () => ({
      ...(statusQuery.length > 0 ? { status: statusQuery } : {}),
      ...(deferredSearch ? { search: deferredSearch } : {}),
      sort,
      cursor,
      limit: PAGE_SIZE,
    }),
    [statusQuery, deferredSearch, sort, cursor],
  )

  const listQuery = useQuery({
    ...orpc.workboard.list.queryOptions({ input: queryInput }),
    placeholderData: keepPreviousData,
  })

  const updateStatusMutation = useMutation(
    orpc.obligations.updateStatus.mutationOptions({
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: orpc.workboard.list.key() })
        // Show a short audit reference so the user has an immediately
        // checkable "did this write to audit?" answer (Day 3 acceptance).
        toast.success(t`Status updated`, {
          description: t`Audit ${result.auditId.slice(0, 8)}`,
        })
      },
      onError: (err) => {
        toast.error(t`Couldn't update status`, {
          description: rpcErrorMessage(err) ?? t`Please try again.`,
        })
      },
    }),
  )

  const rows = useMemo(() => listQuery.data?.rows ?? EMPTY_WORKBOARD_ROWS, [listQuery.data?.rows])
  const nextCursor = listQuery.data?.nextCursor ?? null
  const isInitialLoading = listQuery.isLoading
  const isError = listQuery.isError
  const keyboardEnabled = rows.length > 0 && !shortcutsBlocked

  const rowsById = useMemo(
    () => new Map(rows.map((workboardRow) => [workboardRow.id, workboardRow])),
    [rows],
  )
  const activeRow = (row ? rowsById.get(row) : null) ?? rows[0] ?? null
  const rowSelection = useMemo<RowSelectionState>(
    () => (activeRow ? { [activeRow.id]: true } : {}),
    [activeRow],
  )

  const onRowSelectionChange = useCallback(
    (updater: Updater<RowSelectionState>) => {
      const nextSelection = functionalUpdate(updater, rowSelection)
      const selectedRowId = Object.keys(nextSelection).find((id) => nextSelection[id]) ?? null
      void setWorkboardQuery({ row: selectedRowId })
    },
    [rowSelection, setWorkboardQuery],
  )

  const updateStatus = updateStatusMutation.mutate
  const statusUpdatePending = updateStatusMutation.isPending

  const columns = useMemo<ColumnDef<WorkboardRow>[]>(
    () => [
      {
        accessorKey: 'clientName',
        header: t`Client`,
        cell: (info) => info.getValue<string>(),
        meta: { cellClassName: 'font-medium text-text-primary' },
      },
      {
        accessorKey: 'taxType',
        header: t`Tax type`,
        cell: (info) => info.getValue<string>(),
        meta: { cellClassName: 'text-text-secondary' },
      },
      {
        accessorKey: 'currentDueDate',
        header: t`Due date`,
        cell: (info) => formatDate(info.getValue<string>()),
        meta: { cellClassName: 'font-mono tabular-nums' },
      },
      {
        accessorKey: 'status',
        header: t`Status`,
        cell: ({ row: tableRow }) => {
          const workboardRow = tableRow.original
          return (
            <div className="flex items-center gap-3">
              <Badge variant={STATUS_VARIANT[workboardRow.status]}>
                <BadgeStatusDot tone={STATUS_DOT[workboardRow.status]} />
                {statusLabels[workboardRow.status]}
              </Badge>
              <Select
                value={workboardRow.status}
                onValueChange={(value) => {
                  if (typeof value !== 'string' || !isObligationStatus(value)) return
                  if (value === workboardRow.status) return
                  updateStatus({ id: workboardRow.id, status: value })
                }}
                disabled={statusUpdatePending}
              >
                <SelectTrigger
                  size="sm"
                  className="min-w-40"
                  aria-label={t`Change status for ${workboardRow.clientName}`}
                >
                  <SelectValue placeholder={statusLabels[workboardRow.status]} />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        },
      },
    ],
    [statusLabels, statusUpdatePending, t, updateStatus],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      rowSelection,
      sorting,
    },
    enableMultiRowSelection: false,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (workboardRow) => workboardRow.id,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onRowSelectionChange,
  })

  const totalShown = table.getRowModel().rows.length

  const moveActiveRow = useCallback(
    (direction: 1 | -1) => {
      const tableRows = table.getRowModel().rows
      if (tableRows.length === 0) return
      const currentIndex = tableRows.findIndex((tableRow) => tableRow.original.id === activeRow?.id)
      const nextIndex =
        currentIndex === -1
          ? 0
          : Math.min(tableRows.length - 1, Math.max(0, currentIndex + direction))
      const nextRowId = tableRows[nextIndex]?.original.id ?? null
      void setWorkboardQuery({ row: nextRowId })
    },
    [activeRow?.id, setWorkboardQuery, table],
  )

  const updateActiveRowStatus = useCallback(
    (status: ObligationStatus, target?: EventTarget | null) => {
      if (
        isInteractiveEventTarget(target ?? null) ||
        !activeRow ||
        activeRow.status === status ||
        statusUpdatePending
      ) {
        return
      }
      updateStatus({ id: activeRow.id, status })
    },
    [activeRow, statusUpdatePending, updateStatus],
  )

  useAppHotkey('J', () => moveActiveRow(1), {
    enabled: keyboardEnabled,
    requireReset: true,
    meta: {
      id: 'workboard.next-row',
      name: 'Next row',
      description: 'Move the active Workboard row down.',
      category: 'workboard',
      scope: 'route',
    },
  })

  useAppHotkey('K', () => moveActiveRow(-1), {
    enabled: keyboardEnabled,
    requireReset: true,
    meta: {
      id: 'workboard.previous-row',
      name: 'Previous row',
      description: 'Move the active Workboard row up.',
      category: 'workboard',
      scope: 'route',
    },
  })

  useAppHotkey(
    'Enter',
    (event) => {
      if (isInteractiveEventTarget(event.target)) return
      if (!activeRow) return
      toast.message(t`Detail drawer is coming soon`, {
        description: activeRow.clientName,
      })
    },
    {
      enabled: keyboardEnabled,
      requireReset: true,
      meta: {
        id: 'workboard.open-detail',
        name: 'Open detail',
        description: 'Open the active obligation detail drawer.',
        category: 'workboard',
        scope: 'route',
      },
    },
  )

  useAppHotkey(
    'E',
    (event) => {
      if (isInteractiveEventTarget(event.target)) return
      if (!activeRow) return
      toast.message(t`Evidence drawer is coming soon`, {
        description: activeRow.clientName,
      })
    },
    {
      enabled: keyboardEnabled,
      requireReset: true,
      meta: {
        id: 'workboard.open-evidence',
        name: 'Open evidence',
        description: 'Open evidence for the active row.',
        category: 'workboard',
        scope: 'route',
      },
    },
  )

  useAppHotkey('F', (event) => updateActiveRowStatus('done', event.target), {
    enabled: keyboardEnabled,
    requireReset: true,
    meta: {
      id: 'workboard.mark-filed',
      name: 'Mark filed',
      description: 'Mark the active row as done.',
      category: 'workboard',
      scope: 'route',
    },
  })

  useAppHotkey('X', (event) => updateActiveRowStatus('review', event.target), {
    enabled: keyboardEnabled,
    requireReset: true,
    meta: {
      id: 'workboard.mark-extended',
      name: 'Mark extended',
      description: 'Move the active row into review until extension status lands.',
      category: 'workboard',
      scope: 'route',
    },
  })

  useAppHotkey('I', (event) => updateActiveRowStatus('in_progress', event.target), {
    enabled: keyboardEnabled,
    requireReset: true,
    meta: {
      id: 'workboard.mark-in-progress',
      name: 'Mark in progress',
      description: 'Mark the active row as in progress.',
      category: 'workboard',
      scope: 'route',
    },
  })

  useAppHotkey('W', (event) => updateActiveRowStatus('waiting_on_client', event.target), {
    enabled: keyboardEnabled,
    requireReset: true,
    meta: {
      id: 'workboard.mark-waiting',
      name: 'Mark waiting on client',
      description: 'Mark the active row as waiting on client.',
      category: 'workboard',
      scope: 'route',
    },
  })

  function toggleStatus(status: ObligationStatus) {
    const nextStatus = statusFilter.includes(status)
      ? statusFilter.filter((current) => current !== status)
      : [...statusFilter, status]
    void setWorkboardQuery({
      status: nextStatus.length > 0 ? nextStatus : null,
      cursor: null,
      row: null,
    })
  }

  function loadMore() {
    if (!nextCursor) return
    void setWorkboardQuery({ cursor: nextCursor, row: null })
  }

  function resetWorkboard() {
    void setWorkboardQuery(null)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Trans>Workboard</Trans>
        </span>
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold leading-tight text-text-primary">
              <Trans>Obligation queue</Trans>
            </h1>
            <p className="max-w-180 text-md text-text-secondary">
              <Trans>
                Status changes write an audit row in the same call so the trail stays trustworthy.
              </Trans>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetWorkboard}>
              <FilterIcon data-icon="inline-start" />
              <Trans>Reset</Trans>
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans>Queue controls</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Filter by status, search clients, and sort by due date.</Trans>
          </CardDescription>
          <CardAction>
            <Badge variant="outline" className="font-mono tabular-nums">
              <Plural value={totalShown} one="# row" other="# rows" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-90">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                aria-label={t`Search obligations`}
                className="pl-8"
                placeholder={t`Search clients`}
                value={searchInput}
                onChange={(event) => {
                  void setWorkboardQuery({
                    q: event.target.value || null,
                    cursor: null,
                    row: null,
                  })
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                <Trans>Sort</Trans>
              </span>
              <Select
                value={sort}
                onValueChange={(value) => {
                  if (typeof value !== 'string' || !isWorkboardSort(value)) return
                  void setWorkboardQuery({
                    sort: withDefaultSortCleared(value),
                    cursor: null,
                    row: null,
                  })
                }}
              >
                <SelectTrigger size="sm" className="min-w-50">
                  <SelectValue placeholder={sortLabels[sort]} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_asc">{sortLabels.due_asc}</SelectItem>
                  <SelectItem value="due_desc">{sortLabels.due_desc}</SelectItem>
                  <SelectItem value="updated_desc">{sortLabels.updated_desc}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="cursor-pointer focus-visible:outline-none"
              onClick={() => void setWorkboardQuery({ status: null, cursor: null, row: null })}
            >
              <Badge variant={statusFilter.length === 0 ? 'default' : 'ghost'}>
                <Trans>All</Trans>
              </Badge>
            </button>
            {ALL_STATUSES.map((status) => {
              const active = statusFilter.includes(status)
              return (
                <button
                  key={status}
                  type="button"
                  className="cursor-pointer focus-visible:outline-none"
                  onClick={() => toggleStatus(status)}
                  aria-pressed={active}
                >
                  <Badge variant={active ? 'default' : 'ghost'}>{statusLabels[status]}</Badge>
                </button>
              )
            })}
          </div>

          {isInitialLoading ? (
            <div className="rounded-lg border border-dashed border-divider-regular py-8 text-center text-sm text-text-tertiary">
              <Trans>Loading queue…</Trans>
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-state-destructive-border bg-state-destructive-hover p-4 text-sm text-text-destructive">
              <Trans>Couldn't load the queue.</Trans>{' '}
              <button type="button" className="underline" onClick={() => void listQuery.refetch()}>
                <Trans>Retry</Trans>
              </button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState onOpenWizard={openWizard} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const meta = columnMeta(header.column.columnDef)
                        return (
                          <TableHead
                            key={header.id}
                            className={meta.headerClassName}
                            colSpan={header.colSpan}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((tableRow) => (
                    <TableRow
                      key={tableRow.id}
                      aria-selected={tableRow.getIsSelected()}
                      data-state={tableRow.getIsSelected() ? 'selected' : undefined}
                      onClick={() => void setWorkboardQuery({ row: tableRow.original.id })}
                    >
                      {tableRow.getVisibleCells().map((cell) => {
                        const meta = columnMeta(cell.column.columnDef)
                        return (
                          <TableCell key={cell.id} className={meta.cellClassName}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">
                  <Plural value={totalShown} one="# obligation" other="# obligations" />
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!nextCursor || listQuery.isFetching}
                  onClick={loadMore}
                >
                  {listQuery.isFetching ? <Trans>Loading…</Trans> : <Trans>Load more</Trans>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState({ onOpenWizard }: { onOpenWizard: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-divider-regular py-10 px-6 text-center">
      <span className="text-md font-semibold text-text-primary">
        <Trans>No obligations match these filters.</Trans>
      </span>
      <p className="max-w-105 text-sm text-text-secondary">
        <Trans>
          Run the migration wizard to import a CSV of clients, or change the filters above.
        </Trans>
      </p>
      <Button size="sm" onClick={onOpenWizard}>
        <Trans>Run migration</Trans>
      </Button>
    </div>
  )
}
