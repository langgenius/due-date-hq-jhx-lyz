import { useCallback, useMemo, useState } from 'react'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileSearchIcon, FilterIcon, SearchIcon } from 'lucide-react'
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  type inferParserType,
} from 'nuqs'
import { toast } from 'sonner'

import {
  WORKBOARD_SEARCH_MAX_LENGTH,
  type WorkboardListInput,
  type WorkboardRow,
  type WorkboardSort,
} from '@duedatehq/contracts'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@duedatehq/ui/components/ui/dialog'
import { Separator } from '@duedatehq/ui/components/ui/separator'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@duedatehq/ui/components/ui/sheet'

import {
  isInteractiveEventTarget,
  useAppHotkey,
  useKeyboardShortcutsBlocked,
} from '@/components/patterns/keyboard-shell'
import { useEvidenceDrawer } from '@/features/evidence/EvidenceDrawerProvider'
import { useMigrationWizard } from '@/features/migration/WizardProvider'
import {
  ALL_STATUSES,
  WorkboardStatusControl,
  useStatusLabels,
  type ObligationStatus,
} from '@/features/workboard/status-control'
import { queryInputUrlUpdateRateLimit, useDebouncedQueryInput } from '@/lib/query-rate-limit'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'
import { formatCents, formatDate } from '@/lib/utils'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string
    cellClassName?: string
  }
}
type WorkboardCursor = NonNullable<WorkboardListInput['cursor']> | null
type WorkboardListInputWithoutCursor = Omit<WorkboardListInput, 'cursor'>

const ALL_SORTS = [
  'due_asc',
  'due_desc',
  'updated_desc',
] as const satisfies readonly WorkboardSort[]
const OWNER_FILTERS = ['unassigned'] as const
const DUE_FILTERS = ['overdue'] as const
const EXPOSURE_FILTERS = ['ready', 'needs_input', 'unsupported'] as const
const EVIDENCE_FILTERS = ['needs'] as const
const DEFAULT_SORT: WorkboardSort = 'due_asc'
const EMPTY_WORKBOARD_ROWS: WorkboardRow[] = []
const INITIAL_CURSOR: WorkboardCursor = null
const PAGE_SIZE = 50
const REPLACE_HISTORY_OPTIONS = { history: 'replace' } as const

export const workboardSearchParamsParsers = {
  q: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  status: parseAsArrayOf(parseAsStringLiteral(ALL_STATUSES))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  assignee: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  owner: parseAsStringLiteral(OWNER_FILTERS).withOptions(REPLACE_HISTORY_OPTIONS),
  due: parseAsStringLiteral(DUE_FILTERS).withOptions(REPLACE_HISTORY_OPTIONS),
  dueWithin: parseAsInteger.withOptions(REPLACE_HISTORY_OPTIONS),
  exposure: parseAsStringLiteral(EXPOSURE_FILTERS).withOptions(REPLACE_HISTORY_OPTIONS),
  evidence: parseAsStringLiteral(EVIDENCE_FILTERS).withOptions(REPLACE_HISTORY_OPTIONS),
  asOf: parseAsString.withOptions(REPLACE_HISTORY_OPTIONS),
  sort: parseAsStringLiteral(ALL_SORTS)
    .withDefault(DEFAULT_SORT)
    .withOptions(REPLACE_HISTORY_OPTIONS),
  row: parseAsString.withOptions(REPLACE_HISTORY_OPTIONS),
} as const

export type WorkboardSearchParams = inferParserType<typeof workboardSearchParamsParsers>

function isWorkboardSort(value: string): value is WorkboardSort {
  return ALL_SORTS.some((sortOption) => sortOption === value)
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

export function WorkboardRoute() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const { openWizard } = useMigrationWizard()
  const { openEvidence } = useEvidenceDrawer()
  const shortcutsBlocked = useKeyboardShortcutsBlocked()
  const statusLabels = useStatusLabels()
  const sortLabels = useSortLabels()
  const [
    {
      q: searchInput,
      status: statusFilter,
      assignee,
      owner,
      due,
      dueWithin,
      exposure,
      evidence,
      asOf,
      sort,
      row,
    },
    setWorkboardQuery,
  ] = useQueryStates(workboardSearchParamsParsers)
  const [detailRow, setDetailRow] = useState<WorkboardRow | null>(null)
  const [penaltyRow, setPenaltyRow] = useState<WorkboardRow | null>(null)

  const debouncedSearch = useDebouncedQueryInput(searchInput, {
    maxLength: WORKBOARD_SEARCH_MAX_LENGTH,
  })
  const sorting = useMemo(() => getSortingState(sort), [sort])
  const statusQuery = useMemo(() => [...statusFilter], [statusFilter])

  const queryInputWithoutCursor = useMemo<WorkboardListInputWithoutCursor>(
    () => ({
      ...(statusQuery.length > 0 ? { status: statusQuery } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(assignee ? { assigneeName: assignee } : {}),
      ...(owner ? { owner } : {}),
      ...(due ? { due } : {}),
      ...(dueWithin && dueWithin > 0 && dueWithin <= 30 ? { dueWithinDays: dueWithin } : {}),
      ...(exposure ? { exposureStatus: exposure } : {}),
      ...(evidence === 'needs' ? { needsEvidence: true } : {}),
      ...(asOf ? { asOfDate: asOf } : {}),
      sort,
      limit: PAGE_SIZE,
    }),
    [statusQuery, debouncedSearch, assignee, owner, due, dueWithin, exposure, evidence, asOf, sort],
  )

  const listQuery = useInfiniteQuery(
    orpc.workboard.list.infiniteOptions({
      initialPageParam: INITIAL_CURSOR,
      input: (cursor) => ({
        ...queryInputWithoutCursor,
        cursor,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
  )

  const updateStatusMutation = useMutation(
    orpc.obligations.updateStatus.mutationOptions({
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: orpc.workboard.list.key() })
        void queryClient.invalidateQueries({ queryKey: orpc.dashboard.load.key() })
        void queryClient.invalidateQueries({ queryKey: orpc.audit.key() })
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

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.rows) ?? EMPTY_WORKBOARD_ROWS,
    [listQuery.data?.pages],
  )
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
        accessorKey: 'assigneeName',
        header: t`Owner`,
        cell: (info) => info.getValue<string | null>() ?? t`Unassigned`,
        meta: { cellClassName: 'text-text-secondary' },
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
        accessorKey: 'estimatedExposureCents',
        header: t`Exposure`,
        cell: ({ row: tableRow }) => (
          <ExposurePill row={tableRow.original} onNeedsInput={setPenaltyRow} />
        ),
      },
      {
        accessorKey: 'evidenceCount',
        header: t`Evidence`,
        cell: ({ row: tableRow }) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={t`Open evidence for ${tableRow.original.clientName}`}
            onClick={(event) => {
              event.stopPropagation()
              openEvidence({
                obligationId: tableRow.original.id,
                label: `${tableRow.original.clientName} - ${tableRow.original.taxType}`,
              })
            }}
          >
            <FileSearchIcon data-icon="inline-start" />
            {tableRow.original.evidenceCount > 0 ? tableRow.original.evidenceCount : t`Open`}
          </Button>
        ),
      },
      {
        accessorKey: 'status',
        header: t`Status`,
        cell: ({ row: tableRow }) => {
          const workboardRow = tableRow.original
          return (
            <WorkboardStatusControl
              row={workboardRow}
              labels={statusLabels}
              disabled={statusUpdatePending}
              onChange={(id, status) => updateStatus({ id, status })}
            />
          )
        },
      },
    ],
    [openEvidence, statusLabels, statusUpdatePending, t, updateStatus],
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
      setDetailRow(activeRow)
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
      openEvidence({
        obligationId: activeRow.id,
        label: `${activeRow.clientName} - ${activeRow.taxType}`,
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
      row: null,
    })
  }

  function loadMore() {
    if (!listQuery.hasNextPage) return
    void listQuery.fetchNextPage()
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
                  const nextSearch = event.target.value
                  void setWorkboardQuery(
                    {
                      q: nextSearch || null,
                      row: null,
                    },
                    nextSearch === ''
                      ? undefined
                      : { limitUrlUpdates: queryInputUrlUpdateRateLimit },
                  )
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
                    row: null,
                  })
                }}
              >
                <SelectTrigger size="sm" className="min-w-50">
                  <SelectValue>{sortLabels[sort]}</SelectValue>
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
              onClick={() => void setWorkboardQuery({ dueWithin: 7, due: null, row: null })}
            >
              <Badge variant={dueWithin === 7 ? 'default' : 'ghost'}>
                <Trans>This week</Trans>
              </Badge>
            </button>
            <button
              type="button"
              className="cursor-pointer focus-visible:outline-none"
              onClick={() =>
                void setWorkboardQuery({
                  exposure: exposure === 'needs_input' ? null : 'needs_input',
                  row: null,
                })
              }
            >
              <Badge variant={exposure === 'needs_input' ? 'default' : 'ghost'}>
                <Trans>Needs input</Trans>
              </Badge>
            </button>
            <button
              type="button"
              className="cursor-pointer focus-visible:outline-none"
              onClick={() =>
                void setWorkboardQuery({
                  evidence: evidence === 'needs' ? null : 'needs',
                  row: null,
                })
              }
            >
              <Badge variant={evidence === 'needs' ? 'default' : 'ghost'}>
                <Trans>Needs evidence</Trans>
              </Badge>
            </button>
            <button
              type="button"
              className="cursor-pointer focus-visible:outline-none"
              onClick={() => toggleStatus('review')}
            >
              <Badge variant={statusFilter.includes('review') ? 'default' : 'ghost'}>
                <Trans>Review</Trans>
              </Badge>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="cursor-pointer focus-visible:outline-none"
              onClick={() => void setWorkboardQuery({ status: null, row: null })}
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
                        const meta = header.column.columnDef.meta
                        return (
                          <TableHead
                            key={header.id}
                            className={meta?.headerClassName}
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
                        const meta = cell.column.columnDef.meta
                        return (
                          <TableCell key={cell.id} className={meta?.cellClassName}>
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
                  disabled={!listQuery.hasNextPage || listQuery.isFetchingNextPage}
                  onClick={loadMore}
                >
                  {listQuery.isFetchingNextPage ? (
                    <Trans>Loading…</Trans>
                  ) : (
                    <Trans>Load more</Trans>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <WorkboardDetailDrawer
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onOpenEvidence={(rowToOpen) =>
          openEvidence({
            obligationId: rowToOpen.id,
            label: `${rowToOpen.clientName} - ${rowToOpen.taxType}`,
          })
        }
      />
      <PenaltyInputDialog
        row={penaltyRow}
        onClose={() => setPenaltyRow(null)}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: orpc.workboard.list.key() })
          void queryClient.invalidateQueries({ queryKey: orpc.dashboard.load.key() })
        }}
      />
    </div>
  )
}

function ExposurePill({
  row,
  onNeedsInput,
}: {
  row: WorkboardRow
  onNeedsInput: (row: WorkboardRow) => void
}) {
  if (row.exposureStatus === 'ready' && row.estimatedExposureCents !== null) {
    return (
      <Badge variant="warning" className="font-mono tabular-nums">
        {formatCents(row.estimatedExposureCents)}
      </Badge>
    )
  }
  if (row.exposureStatus === 'needs_input') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation()
          onNeedsInput(row)
        }}
      >
        <Trans>needs input</Trans>
      </Button>
    )
  }
  return <Badge variant="outline">unsupported</Badge>
}

function WorkboardDetailDrawer({
  row,
  onClose,
  onOpenEvidence,
}: {
  row: WorkboardRow | null
  onClose: () => void
  onOpenEvidence: (row: WorkboardRow) => void
}) {
  return (
    <Sheet open={row !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent className="w-full sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>{row?.clientName ?? <Trans>Obligation detail</Trans>}</SheetTitle>
          <SheetDescription>
            {row ? `${row.taxType} - ${formatDate(row.currentDueDate)}` : null}
          </SheetDescription>
        </SheetHeader>
        {row ? (
          <div className="grid gap-4 px-6 pb-6">
            <DetailRow label="Status" value={row.status} />
            <DetailRow label="Tax type" value={row.taxType} />
            <DetailRow label="Due date" value={formatDate(row.currentDueDate)} />
            <DetailRow
              label="Exposure"
              value={
                row.exposureStatus === 'ready' && row.estimatedExposureCents !== null
                  ? formatCents(row.estimatedExposureCents)
                  : row.exposureStatus
              }
            />
            <DetailRow label="Evidence" value={String(row.evidenceCount)} />
            <Separator />
          </div>
        ) : null}
        <SheetFooter>
          {row ? (
            <Button onClick={() => onOpenEvidence(row)}>
              <FileSearchIcon data-icon="inline-start" />
              <Trans>Open evidence</Trans>
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 text-sm">
      <dt className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{label}</dt>
      <dd className="break-words text-text-primary">{value}</dd>
    </div>
  )
}

function PenaltyInputDialog({
  row,
  onClose,
  onSaved,
}: {
  row: WorkboardRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLingui()
  const [draft, setDraft] = useState({ rowId: '', taxDue: '', ownerCount: '' })
  const mutation = useMutation(
    orpc.clients.updatePenaltyInputs.mutationOptions({
      onSuccess: () => {
        toast.success(t`Penalty inputs saved`)
        onSaved()
        onClose()
      },
      onError: (err) => {
        toast.error(t`Couldn't save penalty inputs`, {
          description: rpcErrorMessage(err) ?? t`Please try again.`,
        })
      },
    }),
  )

  if (row && draft.rowId !== row.id) {
    setDraft({ rowId: row.id, taxDue: '', ownerCount: '' })
  }

  function save() {
    if (!row) return
    const taxDue = parseMoneyCents(draft.taxDue)
    const ownerCount = parseOwnerCount(draft.ownerCount)
    mutation.mutate({
      id: row.clientId,
      ...(taxDue !== null ? { estimatedTaxLiabilityCents: taxDue } : {}),
      ...(ownerCount !== null ? { equityOwnerCount: ownerCount } : {}),
      reason: t`Workboard needs-input update`,
    })
  }

  return (
    <Dialog open={row !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Penalty inputs</Trans>
          </DialogTitle>
          <DialogDescription>{row ? `${row.clientName} - ${row.taxType}` : null}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input
            inputMode="decimal"
            placeholder={t`Estimated tax due`}
            value={draft.taxDue}
            onChange={(event) =>
              setDraft((current) => ({ ...current, taxDue: event.target.value }))
            }
          />
          <Input
            inputMode="numeric"
            placeholder={t`Owner count`}
            value={draft.ownerCount}
            onChange={(event) =>
              setDraft((current) => ({ ...current, ownerCount: event.target.value }))
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <Trans>Cancel</Trans>
          </Button>
          <Button onClick={save} disabled={mutation.isPending}>
            <Trans>Save changes</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function parseMoneyCents(value: string): number | null {
  const normalized = value.trim().replace(/[$,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null
}

function parseOwnerCount(value: string): number | null {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
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
