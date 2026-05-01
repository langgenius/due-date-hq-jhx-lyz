import { useCallback, useMemo, useState, type HTMLAttributes } from 'react'
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
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDownIcon, FileSearchIcon, FilterIcon, SearchIcon } from 'lucide-react'
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
  WORKBOARD_FILTER_MAX_SELECTIONS,
  type WorkboardFacetOption,
  type WorkboardListInput,
  type WorkboardReadiness,
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@duedatehq/ui/components/ui/dropdown-menu'
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
const READINESS_FILTERS = ['ready', 'waiting', 'needs_review'] as const
const DEFAULT_SORT: WorkboardSort = 'due_asc'
const EMPTY_WORKBOARD_ROWS: WorkboardRow[] = []
const EMPTY_FACET_OPTIONS: FilterOption[] = []
const EMPTY_CLIENT_OPTIONS: ClientFilterOption[] = []
const EMPTY_COUNTY_OPTIONS: CountyFilterOption[] = []
const INITIAL_CURSOR: WorkboardCursor = null
const PAGE_SIZE = 50
const REPLACE_HISTORY_OPTIONS = { history: 'replace' } as const
const DAYS_FILTER_MIN = -3650
const DAYS_FILTER_MAX = 3650
const UNASSIGNED_OWNER_OPTION = '__unassigned__'
const WORKBOARD_TABLE_PILL_CLASSNAME = 'text-[12px]'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STATE_CODE_RE = /^[A-Z]{2}$/

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface ClientFilterOption extends FilterOption {
  state: string | null
  county: string | null
}

interface CountyFilterOption extends FilterOption {
  state: string | null
}

export const workboardSearchParamsParsers = {
  q: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  status: parseAsArrayOf(parseAsStringLiteral(ALL_STATUSES))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  client: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  state: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  county: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  taxType: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  assignee: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  assignees: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  owner: parseAsStringLiteral(OWNER_FILTERS).withOptions(REPLACE_HISTORY_OPTIONS),
  due: parseAsStringLiteral(DUE_FILTERS).withOptions(REPLACE_HISTORY_OPTIONS),
  dueWithin: parseAsInteger.withOptions(REPLACE_HISTORY_OPTIONS),
  exposure: parseAsStringLiteral(EXPOSURE_FILTERS).withOptions(REPLACE_HISTORY_OPTIONS),
  evidence: parseAsStringLiteral(EVIDENCE_FILTERS).withOptions(REPLACE_HISTORY_OPTIONS),
  readiness: parseAsArrayOf(parseAsStringLiteral(READINESS_FILTERS))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  riskMin: parseAsInteger.withOptions(REPLACE_HISTORY_OPTIONS),
  riskMax: parseAsInteger.withOptions(REPLACE_HISTORY_OPTIONS),
  daysMin: parseAsInteger.withOptions(REPLACE_HISTORY_OPTIONS),
  daysMax: parseAsInteger.withOptions(REPLACE_HISTORY_OPTIONS),
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

function isWorkboardReadiness(value: string): value is WorkboardReadiness {
  return READINESS_FILTERS.some((readiness) => readiness === value)
}

function isObligationStatus(value: string): value is ObligationStatus {
  return ALL_STATUSES.some((status) => status === value)
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

function useReadinessLabels(): Record<WorkboardReadiness, string> {
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

function getSortingState(sort: WorkboardSort): SortingState {
  if (sort === 'due_desc') return [{ id: 'currentDueDate', desc: true }]
  if (sort === 'updated_desc') return [{ id: 'updatedAt', desc: true }]
  return [{ id: 'currentDueDate', desc: false }]
}

function withDefaultSortCleared(sort: WorkboardSort): WorkboardSort | null {
  return sort === DEFAULT_SORT ? null : sort
}

function cleanStringFilters(values: readonly string[], maxLength = 120): string[] {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value.length <= maxLength),
    ),
  ].slice(0, WORKBOARD_FILTER_MAX_SELECTIONS)
}

function cleanEntityIdFilters(values: readonly string[]): string[] {
  return cleanStringFilters(values).filter((value) => UUID_RE.test(value))
}

function cleanStateFilters(values: readonly string[]): string[] {
  return cleanStringFilters(values)
    .map((value) => value.toUpperCase())
    .filter((value) => STATE_CODE_RE.test(value))
}

function integerFromInput(value: string, min?: number): number | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  if (!/^-?\d+$/.test(trimmed)) return null
  const parsed = Number(trimmed)
  if (!Number.isSafeInteger(parsed)) return null
  return min === undefined ? parsed : Math.max(min, parsed)
}

function dollarsToCents(value: number | null): number | undefined {
  if (value === null || value < 0 || !Number.isSafeInteger(value)) return undefined
  const cents = value * 100
  return Number.isSafeInteger(cents) ? cents : undefined
}

function daysFilterValue(value: number | null): number | undefined {
  if (value === null || !Number.isSafeInteger(value)) return undefined
  return Math.min(DAYS_FILTER_MAX, Math.max(DAYS_FILTER_MIN, value))
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const leftSet = new Set(left)
  return right.every((value) => leftSet.has(value))
}

function inputValueFromNumber(value: number | null): string {
  return value === null ? '' : String(value)
}

function facetOptionToFilterOption(option: WorkboardFacetOption): FilterOption {
  return {
    value: option.value,
    label: option.label,
    count: option.count,
  }
}

export function WorkboardRoute() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const { openWizard } = useMigrationWizard()
  const { openEvidence } = useEvidenceDrawer()
  const shortcutsBlocked = useKeyboardShortcutsBlocked()
  const statusLabels = useStatusLabels()
  const sortLabels = useSortLabels()
  const readinessLabels = useReadinessLabels()
  const [
    {
      q: searchInput,
      status: statusFilter,
      client: clientFilter,
      state: stateFilter,
      county: countyFilter,
      taxType: taxTypeFilter,
      assignee,
      assignees: assigneeFilter,
      owner,
      due,
      dueWithin,
      exposure,
      evidence,
      readiness: readinessFilter,
      riskMin,
      riskMax,
      daysMin,
      daysMax,
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
  const clientQuery = useMemo(() => cleanEntityIdFilters(clientFilter), [clientFilter])
  const stateQuery = useMemo(() => cleanStateFilters(stateFilter), [stateFilter])
  const countyQuery = useMemo(() => cleanStringFilters(countyFilter), [countyFilter])
  const taxTypeQuery = useMemo(() => cleanStringFilters(taxTypeFilter), [taxTypeFilter])
  const assigneeNameQuery = useMemo(
    () => cleanStringFilters(assignee ? [assignee] : [])[0] ?? null,
    [assignee],
  )
  const assigneeQuery = useMemo(() => cleanStringFilters(assigneeFilter), [assigneeFilter])
  const combinedAssigneeQuery = useMemo(
    () => cleanStringFilters([...(assigneeNameQuery ? [assigneeNameQuery] : []), ...assigneeQuery]),
    [assigneeNameQuery, assigneeQuery],
  )
  const readinessQuery = useMemo(() => [...readinessFilter], [readinessFilter])
  const minExposureCents = useMemo(() => dollarsToCents(riskMin), [riskMin])
  const maxExposureCents = useMemo(() => dollarsToCents(riskMax), [riskMax])
  const minDaysUntilDue = useMemo(() => daysFilterValue(daysMin), [daysMin])
  const maxDaysUntilDue = useMemo(() => daysFilterValue(daysMax), [daysMax])

  const facetsQuery = useQuery(orpc.workboard.facets.queryOptions({ input: undefined }))
  const clientOptions = useMemo<ClientFilterOption[]>(
    () =>
      facetsQuery.data?.clients.map((option) => ({
        value: option.value,
        label: option.label,
        count: option.count,
        state: option.state,
        county: option.county,
      })) ?? EMPTY_CLIENT_OPTIONS,
    [facetsQuery.data?.clients],
  )
  const stateOptions = useMemo<FilterOption[]>(
    () => facetsQuery.data?.states.map(facetOptionToFilterOption) ?? EMPTY_FACET_OPTIONS,
    [facetsQuery.data?.states],
  )
  const countyOptions = useMemo<CountyFilterOption[]>(() => {
    const allCounties = facetsQuery.data?.counties ?? EMPTY_COUNTY_OPTIONS
    return allCounties
      .filter((option) => stateQuery.length === 0 || stateQuery.includes(option.state ?? ''))
      .map((option) =>
        Object.assign(
          { value: option.value, label: stateQuery.length > 0 ? option.value : option.label },
          option.count !== undefined ? { count: option.count } : {},
          { state: option.state },
        ),
      )
  }, [facetsQuery.data?.counties, stateQuery])
  const taxTypeOptions = useMemo<FilterOption[]>(
    () => facetsQuery.data?.taxTypes.map(facetOptionToFilterOption) ?? EMPTY_FACET_OPTIONS,
    [facetsQuery.data?.taxTypes],
  )
  const assigneeOptions = useMemo<FilterOption[]>(
    () => facetsQuery.data?.assigneeNames.map(facetOptionToFilterOption) ?? EMPTY_FACET_OPTIONS,
    [facetsQuery.data?.assigneeNames],
  )
  const ownerOptions = useMemo<FilterOption[]>(
    () => [{ value: UNASSIGNED_OWNER_OPTION, label: t`Unassigned` }, ...assigneeOptions],
    [assigneeOptions, t],
  )
  const ownerQuery = useMemo(
    () => (owner === 'unassigned' ? [UNASSIGNED_OWNER_OPTION] : combinedAssigneeQuery),
    [combinedAssigneeQuery, owner],
  )
  const readinessOptions = useMemo<FilterOption[]>(
    () =>
      READINESS_FILTERS.map((readiness) => ({
        value: readiness,
        label: readinessLabels[readiness],
      })),
    [readinessLabels],
  )
  const statusOptions = useMemo<FilterOption[]>(
    () =>
      ALL_STATUSES.map((status) => ({
        value: status,
        label: statusLabels[status],
      })),
    [statusLabels],
  )
  const filtersDisabled = facetsQuery.isLoading

  const queryInputWithoutCursor = useMemo<WorkboardListInputWithoutCursor>(
    () => ({
      ...(statusQuery.length > 0 ? { status: statusQuery } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(clientQuery.length > 0 ? { clientIds: clientQuery } : {}),
      ...(stateQuery.length > 0 ? { states: stateQuery } : {}),
      ...(countyQuery.length > 0 ? { counties: countyQuery } : {}),
      ...(taxTypeQuery.length > 0 ? { taxTypes: taxTypeQuery } : {}),
      ...(assigneeNameQuery ? { assigneeName: assigneeNameQuery } : {}),
      ...(assigneeQuery.length > 0 ? { assigneeNames: assigneeQuery } : {}),
      ...(owner ? { owner } : {}),
      ...(due ? { due } : {}),
      ...(dueWithin && dueWithin > 0 && dueWithin <= 30 ? { dueWithinDays: dueWithin } : {}),
      ...(exposure ? { exposureStatus: exposure } : {}),
      ...(readinessQuery.length > 0 ? { readiness: readinessQuery } : {}),
      ...(minExposureCents !== undefined ? { minExposureCents } : {}),
      ...(maxExposureCents !== undefined ? { maxExposureCents } : {}),
      ...(minDaysUntilDue !== undefined ? { minDaysUntilDue } : {}),
      ...(maxDaysUntilDue !== undefined ? { maxDaysUntilDue } : {}),
      ...(evidence === 'needs' ? { needsEvidence: true } : {}),
      ...(asOf ? { asOfDate: asOf } : {}),
      sort,
      limit: PAGE_SIZE,
    }),
    [
      statusQuery,
      debouncedSearch,
      clientQuery,
      stateQuery,
      countyQuery,
      taxTypeQuery,
      assigneeNameQuery,
      assigneeQuery,
      owner,
      due,
      dueWithin,
      exposure,
      readinessQuery,
      minExposureCents,
      maxExposureCents,
      minDaysUntilDue,
      maxDaysUntilDue,
      evidence,
      asOf,
      sort,
    ],
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
        header: () => (
          <MultiFilterDropdown
            trigger="header"
            label={t`Client`}
            options={clientOptions}
            selected={clientQuery}
            disabled={filtersDisabled}
            emptyLabel={t`No clients`}
            searchable
            searchPlaceholder={t`Search clients`}
            onSelectedChange={(nextClient) =>
              void setWorkboardQuery({
                client: nextClient.length > 0 ? nextClient : null,
                row: null,
              })
            }
          />
        ),
        cell: (info) => info.getValue<string>(),
        meta: { cellClassName: 'font-medium text-text-primary' },
      },
      {
        accessorKey: 'assigneeName',
        header: () => (
          <MultiFilterDropdown
            trigger="header"
            label={t`Owner`}
            options={ownerOptions}
            selected={ownerQuery}
            disabled={filtersDisabled}
            emptyLabel={t`No assignees`}
            searchable
            searchPlaceholder={t`Search assignees`}
            onSelectedChange={(nextOwner) => {
              const isUnassigned = nextOwner.includes(UNASSIGNED_OWNER_OPTION)
              const nextAssignee = nextOwner.filter((value) => value !== UNASSIGNED_OWNER_OPTION)
              void setWorkboardQuery({
                owner: isUnassigned ? 'unassigned' : null,
                assignee: null,
                assignees: !isUnassigned && nextAssignee.length > 0 ? nextAssignee : null,
                row: null,
              })
            }}
          />
        ),
        cell: (info) => info.getValue<string | null>() ?? t`Unassigned`,
        meta: { cellClassName: 'text-text-secondary' },
      },
      {
        accessorKey: 'clientState',
        header: () => (
          <MultiFilterDropdown
            trigger="header"
            label={t`State`}
            options={stateOptions}
            selected={stateQuery}
            disabled={filtersDisabled}
            emptyLabel={t`No states`}
            onSelectedChange={(nextState) =>
              void setWorkboardQuery({
                state: nextState.length > 0 ? nextState : null,
                county: null,
                row: null,
              })
            }
          />
        ),
        cell: (info) => info.getValue<string | null>() ?? '—',
        meta: { cellClassName: 'font-mono text-text-secondary' },
      },
      {
        accessorKey: 'clientCounty',
        header: () => (
          <MultiFilterDropdown
            trigger="header"
            label={t`County`}
            options={countyOptions}
            selected={countyQuery}
            disabled={filtersDisabled || countyOptions.length === 0}
            emptyLabel={t`No counties`}
            searchable
            searchPlaceholder={t`Search counties`}
            onSelectedChange={(nextCounty) =>
              void setWorkboardQuery({
                county: nextCounty.length > 0 ? nextCounty : null,
                row: null,
              })
            }
          />
        ),
        cell: (info) => info.getValue<string | null>() ?? '—',
        meta: { cellClassName: 'text-text-secondary' },
      },
      {
        accessorKey: 'taxType',
        header: () => (
          <MultiFilterDropdown
            trigger="header"
            label={t`Tax type`}
            options={taxTypeOptions}
            selected={taxTypeQuery}
            disabled={filtersDisabled}
            emptyLabel={t`No forms`}
            onSelectedChange={(nextTaxType) =>
              void setWorkboardQuery({
                taxType: nextTaxType.length > 0 ? nextTaxType : null,
                row: null,
              })
            }
          />
        ),
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
        accessorKey: 'daysUntilDue',
        header: () => (
          <RangeHeaderFilterDropdown
            label={t`Days`}
            minLabel={t`Minimum days until due`}
            maxLabel={t`Maximum days until due`}
            minPlaceholder={t`Min days`}
            maxPlaceholder={t`Max days`}
            minValue={daysMin}
            maxValue={daysMax}
            inputMode="numeric"
            min={DAYS_FILTER_MIN}
            max={DAYS_FILTER_MAX}
            onCommit={(nextMin, nextMax) =>
              void setWorkboardQuery({
                daysMin: integerFromInput(nextMin),
                daysMax: integerFromInput(nextMax),
                row: null,
              })
            }
          />
        ),
        cell: (info) => {
          const days = info.getValue<number>()
          if (days === 0) return t`Today`
          if (days < 0) return t`${Math.abs(days)} late`
          return t`${days} days`
        },
        meta: { cellClassName: 'font-mono tabular-nums text-text-secondary' },
      },
      {
        accessorKey: 'estimatedExposureCents',
        header: () => (
          <RangeHeaderFilterDropdown
            label={t`Exposure`}
            minLabel={t`Minimum dollars at risk`}
            maxLabel={t`Maximum dollars at risk`}
            minPlaceholder={t`Min $`}
            maxPlaceholder={t`Max $`}
            minValue={riskMin}
            maxValue={riskMax}
            inputMode="numeric"
            min={0}
            onCommit={(nextMin, nextMax) =>
              void setWorkboardQuery({
                riskMin: integerFromInput(nextMin, 0),
                riskMax: integerFromInput(nextMax, 0),
                row: null,
              })
            }
          />
        ),
        cell: ({ row: tableRow }) => (
          <ExposurePill row={tableRow.original} onNeedsInput={setPenaltyRow} />
        ),
      },
      {
        accessorKey: 'readiness',
        header: () => (
          <MultiFilterDropdown
            trigger="header"
            label={t`Readiness`}
            options={readinessOptions}
            selected={readinessQuery}
            emptyLabel={t`No readiness states`}
            onSelectedChange={(nextReadiness) => {
              const typedReadiness = nextReadiness.filter(isWorkboardReadiness)
              void setWorkboardQuery({
                readiness: typedReadiness.length > 0 ? typedReadiness : null,
                row: null,
              })
            }}
          />
        ),
        cell: (info) => (
          <ReadinessPill readiness={info.getValue<WorkboardReadiness>()} labels={readinessLabels} />
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
        header: () => (
          <MultiFilterDropdown
            trigger="header"
            label={t`Status`}
            options={statusOptions}
            selected={statusQuery}
            emptyLabel={t`All statuses`}
            onSelectedChange={(nextStatus) => {
              const typedStatus = nextStatus.filter(isObligationStatus)
              void setWorkboardQuery({
                status: typedStatus.length > 0 ? typedStatus : null,
                row: null,
              })
            }}
          />
        ),
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
    [
      clientOptions,
      clientQuery,
      countyOptions,
      countyQuery,
      daysMax,
      daysMin,
      filtersDisabled,
      openEvidence,
      ownerOptions,
      ownerQuery,
      readinessLabels,
      readinessOptions,
      readinessQuery,
      riskMax,
      riskMin,
      setWorkboardQuery,
      stateOptions,
      stateQuery,
      statusLabels,
      statusOptions,
      statusQuery,
      statusUpdatePending,
      t,
      taxTypeOptions,
      taxTypeQuery,
      updateStatus,
    ],
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

  const tableRows = table.getRowModel().rows
  const totalShown = tableRows.length
  const visibleColumnCount = table.getAllLeafColumns().length

  const moveActiveRow = useCallback(
    (direction: 1 | -1) => {
      const currentRows = table.getRowModel().rows
      if (currentRows.length === 0) return
      const currentIndex = currentRows.findIndex(
        (tableRow) => tableRow.original.id === activeRow?.id,
      )
      const nextIndex =
        currentIndex === -1
          ? 0
          : Math.min(currentRows.length - 1, Math.max(0, currentIndex + direction))
      const nextRowId = currentRows[nextIndex]?.original.id ?? null
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
            <Trans>
              Use table headers to filter by client, geography, form, readiness, owner, risk, and
              timing.
            </Trans>
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
                  {tableRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumnCount} className="py-8">
                        <EmptyState onOpenWizard={openWizard} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableRows.map((tableRow) => (
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
                    ))
                  )}
                </TableBody>
              </Table>

              {tableRows.length > 0 ? (
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
              ) : null}
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
      <Badge
        variant="warning"
        className={`${WORKBOARD_TABLE_PILL_CLASSNAME} font-mono tabular-nums`}
      >
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
  return (
    <Badge variant="outline" className={WORKBOARD_TABLE_PILL_CLASSNAME}>
      unsupported
    </Badge>
  )
}

function ReadinessPill({
  readiness,
  labels,
}: {
  readiness: WorkboardReadiness
  labels: Record<WorkboardReadiness, string>
}) {
  const variant = readiness === 'ready' ? 'success' : readiness === 'waiting' ? 'info' : 'warning'
  return (
    <Badge variant={variant} className={WORKBOARD_TABLE_PILL_CLASSNAME}>
      {labels[readiness]}
    </Badge>
  )
}

function MultiFilterDropdown({
  trigger = 'toolbar',
  label,
  options,
  selected,
  disabled,
  emptyLabel,
  searchable,
  searchPlaceholder,
  onSelectedChange,
}: {
  trigger?: 'toolbar' | 'header'
  label: string
  options: readonly FilterOption[]
  selected: readonly string[]
  disabled?: boolean
  emptyLabel: string
  searchable?: boolean
  searchPlaceholder?: string
  onSelectedChange: (selected: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [draftSelected, setDraftSelected] = useState<string[]>(() => [...selected])
  const [optionSearch, setOptionSearch] = useState('')
  const activeSelected = open ? draftSelected : selected
  const selectedSet = new Set(activeSelected)
  const selectedCount = activeSelected.length
  const atSelectionLimit = selectedCount >= WORKBOARD_FILTER_MAX_SELECTIONS
  const visibleOptions = useMemo(() => {
    const needle = optionSearch.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle),
    )
  }, [optionSearch, options])
  const triggerNode =
    trigger === 'header' ? (
      headerFilterTrigger({ label, activeCount: selectedCount, disabled: disabled ?? false })
    ) : (
      <Button
        variant={selectedCount > 0 ? 'accent' : 'outline'}
        size="sm"
        disabled={disabled}
        className="max-w-52 justify-start"
      >
        <span className="truncate">{label}</span>
        {selectedCount > 0 ? (
          <Badge variant="outline" className="h-4 px-1.5 font-mono tabular-nums">
            {selectedCount}
          </Badge>
        ) : null}
        <ChevronDownIcon data-icon="inline-end" />
      </Button>
    )

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftSelected([...selected])
      setOptionSearch('')
      setOpen(true)
      return
    }
    setOpen(false)
    setOptionSearch('')
    if (!sameStringSet(draftSelected, selected)) {
      onSelectedChange(draftSelected)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger render={triggerNode} />
      <DropdownMenuContent className="max-h-80 w-64 overflow-y-auto" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {searchable ? (
          <>
            <div className="p-2">
              <Input
                aria-label={searchPlaceholder ?? label}
                className="h-8"
                placeholder={searchPlaceholder ?? label}
                value={optionSearch}
                onChange={(event) => setOptionSearch(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
              />
            </div>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {visibleOptions.length === 0 ? (
          <DropdownMenuItem disabled>{emptyLabel}</DropdownMenuItem>
        ) : (
          visibleOptions.map((option) => {
            const checked = selectedSet.has(option.value)
            return (
              <DropdownMenuCheckboxItem
                key={`${option.value}:${option.label}`}
                checked={checked}
                disabled={!checked && atSelectionLimit}
                closeOnClick={false}
                className="gap-2"
                onCheckedChange={(nextChecked) => {
                  const nextSelected = nextChecked
                    ? [...activeSelected, option.value].slice(0, WORKBOARD_FILTER_MAX_SELECTIONS)
                    : activeSelected.filter((value) => value !== option.value)
                  setDraftSelected(nextSelected)
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.count !== undefined ? (
                  <span className="ml-auto pr-2 font-mono text-xs tabular-nums text-text-tertiary">
                    {option.count}
                  </span>
                ) : null}
              </DropdownMenuCheckboxItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RangeHeaderFilterDropdown({
  label,
  minLabel,
  maxLabel,
  minPlaceholder,
  maxPlaceholder,
  minValue,
  maxValue,
  inputMode,
  min,
  max,
  onCommit,
}: {
  label: string
  minLabel: string
  maxLabel: string
  minPlaceholder: string
  maxPlaceholder: string
  minValue: number | null
  maxValue: number | null
  inputMode: HTMLAttributes<HTMLInputElement>['inputMode']
  min?: number
  max?: number
  onCommit: (minValue: string, maxValue: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draftMin, setDraftMin] = useState(inputValueFromNumber(minValue))
  const [draftMax, setDraftMax] = useState(inputValueFromNumber(maxValue))
  const currentMin = inputValueFromNumber(minValue)
  const currentMax = inputValueFromNumber(maxValue)
  const activeMin = open ? draftMin : currentMin
  const activeMax = open ? draftMax : currentMax
  const activeCount = (activeMin.trim() ? 1 : 0) + (activeMax.trim() ? 1 : 0)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftMin(currentMin)
      setDraftMax(currentMax)
      setOpen(true)
      return
    }
    setOpen(false)
    if (draftMin !== currentMin || draftMax !== currentMax) {
      onCommit(draftMin, draftMax)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger render={headerFilterTrigger({ label, activeCount })} />
      <DropdownMenuContent className="w-72" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="grid gap-3 p-2">
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            <span>{minLabel}</span>
            <Input
              inputMode={inputMode}
              min={min}
              max={max}
              className="h-8"
              placeholder={minPlaceholder}
              value={draftMin}
              onChange={(event) => setDraftMin(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            <span>{maxLabel}</span>
            <Input
              inputMode={inputMode}
              min={min}
              max={max}
              className="h-8"
              placeholder={maxPlaceholder}
              value={draftMax}
              onChange={(event) => setDraftMax(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
            />
          </label>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function headerFilterTrigger({
  label,
  activeCount,
  disabled,
}: {
  label: string
  activeCount: number
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-active={activeCount > 0 ? true : undefined}
      className="-mx-2 inline-flex h-7 max-w-40 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium tracking-wider whitespace-nowrap text-text-tertiary uppercase outline-none transition-colors hover:bg-state-base-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-accent-active-alt disabled:pointer-events-none disabled:opacity-50 data-[active=true]:text-text-accent"
    >
      <span className="truncate">{label}</span>
      {activeCount > 0 ? (
        <Badge variant="outline" className="h-4 px-1.5 font-mono text-[10px] tabular-nums">
          {activeCount}
        </Badge>
      ) : null}
      <ChevronDownIcon className="size-3 shrink-0" aria-hidden />
    </button>
  )
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
