import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FilterIcon, SearchIcon } from 'lucide-react'
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

const ALL_STATUSES: ObligationStatus[] = [
  'pending',
  'in_progress',
  'review',
  'waiting_on_client',
  'done',
  'not_applicable',
]

const ALL_SORTS: WorkboardSort[] = ['due_asc', 'due_desc', 'updated_desc']
const EMPTY_WORKBOARD_ROWS: WorkboardRow[] = []

function isObligationStatus(value: string): value is ObligationStatus {
  return (ALL_STATUSES as string[]).includes(value)
}

function isWorkboardSort(value: string): value is WorkboardSort {
  return (ALL_SORTS as string[]).includes(value)
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
  return {
    pending: t`Pending`,
    in_progress: t`In progress`,
    review: t`In review`,
    waiting_on_client: t`Waiting on client`,
    done: t`Done`,
    not_applicable: t`Not applicable`,
  }
}

function useSortLabels(): Record<WorkboardSort, string> {
  const { t } = useLingui()
  return {
    due_asc: t`Due date — earliest first`,
    due_desc: t`Due date — latest first`,
    updated_desc: t`Recently updated`,
  }
}

/**
 * Tiny debounce hook — kept inline because the only consumer is the search
 * input. Pulls in no new deps; resets on unmount.
 */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export function WorkboardRoute() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const { openWizard } = useMigrationWizard()
  const shortcutsBlocked = useKeyboardShortcutsBlocked()
  const statusLabels = useStatusLabels()
  const sortLabels = useSortLabels()

  const [statusFilter, setStatusFilter] = useState<ObligationStatus[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<WorkboardSort>('due_asc')
  const [cursors, setCursors] = useState<Array<string | null>>([null]) // one slot per page
  const [activeRowId, setActiveRowId] = useState<string | null>(null)

  const debouncedSearch = useDebounced(searchInput.trim(), 300)

  // Reset to page 1 whenever a filter / sort / search input changes; keeps the
  // cursor stack honest. We compare with the previous values via useEffect
  // because router state isn't involved.
  useEffect(() => {
    setCursors([null])
  }, [debouncedSearch, sort, statusFilter])

  const currentCursor = cursors[cursors.length - 1] ?? null

  const queryInput = useMemo(
    () => ({
      ...(statusFilter.length > 0 ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      sort,
      cursor: currentCursor,
      limit: 50,
    }),
    [statusFilter, debouncedSearch, sort, currentCursor],
  )

  const listQuery = useQuery(orpc.workboard.list.queryOptions({ input: queryInput }))

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

  const totalShown = rows.length

  useEffect(() => {
    if (rows.length === 0) {
      setActiveRowId(null)
      return
    }
    setActiveRowId((current) =>
      current && rows.some((row) => row.id === current) ? current : (rows[0]?.id ?? null),
    )
  }, [rows])

  const moveActiveRow = useCallback(
    (direction: 1 | -1) => {
      if (rows.length === 0) return
      const currentIndex = rows.findIndex((row) => row.id === activeRowId)
      const nextIndex =
        currentIndex === -1 ? 0 : Math.min(rows.length - 1, Math.max(0, currentIndex + direction))
      setActiveRowId(rows[nextIndex]?.id ?? null)
    },
    [activeRowId, rows],
  )

  const activeRow = rows.find((row) => row.id === activeRowId) ?? rows[0] ?? null

  const updateActiveRowStatus = useCallback(
    (status: ObligationStatus, target?: EventTarget | null) => {
      if (
        isInteractiveEventTarget(target ?? null) ||
        !activeRow ||
        activeRow.status === status ||
        updateStatusMutation.isPending
      ) {
        return
      }
      updateStatusMutation.mutate({ id: activeRow.id, status })
    },
    [activeRow, updateStatusMutation],
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
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  function loadMore() {
    if (!nextCursor) return
    setCursors((prev) => [...prev, nextCursor])
  }

  function resetPagination() {
    setCursors([null])
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
            <p className="max-w-[720px] text-md text-text-secondary">
              <Trans>
                Status changes write an audit row in the same call so the trail stays trustworthy.
              </Trans>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetPagination}>
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
            <div className="relative w-full md:max-w-[360px]">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                aria-label={t`Search obligations`}
                className="pl-8"
                placeholder={t`Search clients`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                <Trans>Sort</Trans>
              </span>
              <Select
                value={sort}
                onValueChange={(v) => {
                  if (typeof v === 'string' && isWorkboardSort(v)) setSort(v)
                }}
              >
                <SelectTrigger size="sm" className="min-w-[200px]">
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
              onClick={() => setStatusFilter([])}
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
                  <TableRow>
                    <TableHead>{t`Client`}</TableHead>
                    <TableHead>{t`Tax type`}</TableHead>
                    <TableHead>{t`Due date`}</TableHead>
                    <TableHead>{t`Status`}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      aria-selected={row.id === activeRowId}
                      className={row.id === activeRowId ? 'bg-state-accent-hover-alt' : undefined}
                      onClick={() => setActiveRowId(row.id)}
                    >
                      <TableCell className="font-medium text-text-primary">
                        {row.clientName}
                      </TableCell>
                      <TableCell className="text-text-secondary">{row.taxType}</TableCell>
                      <TableCell className="font-mono tabular-nums">
                        {formatDate(row.currentDueDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Badge variant={STATUS_VARIANT[row.status]}>
                            <BadgeStatusDot tone={STATUS_DOT[row.status]} />
                            {statusLabels[row.status]}
                          </Badge>
                          <Select
                            value={row.status}
                            onValueChange={(v) => {
                              if (typeof v !== 'string' || !isObligationStatus(v)) return
                              if (v === row.status) return
                              updateStatusMutation.mutate({ id: row.id, status: v })
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger
                              size="sm"
                              className="min-w-[160px]"
                              aria-label={t`Change status for ${row.clientName}`}
                            >
                              <SelectValue placeholder={statusLabels[row.status]} />
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
                      </TableCell>
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
      <p className="max-w-[420px] text-sm text-text-secondary">
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
