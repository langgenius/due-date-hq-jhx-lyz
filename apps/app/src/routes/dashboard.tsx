import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  FileSearchIcon,
  RefreshCwIcon,
  SparklesIcon,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingFn,
  type SortingState,
} from '@tanstack/react-table'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import type {
  DashboardDueBucket,
  DashboardEvidenceFilter,
  DashboardFacetsOutput,
  DashboardLoadInput,
  DashboardBriefPublic,
  DashboardSeverity,
  DashboardSummary,
  DashboardTopRow,
  DashboardTriageTab,
  DashboardTriageTabKey,
} from '@duedatehq/contracts'
import { DASHBOARD_FILTER_MAX_SELECTIONS } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge, BadgeStatusDot } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@duedatehq/ui/components/ui/tabs'
import { cn } from '@duedatehq/ui/lib/utils'
import {
  TableHeaderMultiFilter,
  type TableFilterOption,
} from '@/components/patterns/table-header-filter'
import { ConceptLabel } from '@/features/concepts/concept-help'
import { severityRowClass } from '@/features/dashboard/severity-row'
import { useEvidenceDrawer } from '@/features/evidence/EvidenceDrawerProvider'
import { useMigrationWizard } from '@/features/migration/WizardProvider'
import { PulseAlertsBanner } from '@/features/pulse/PulseAlertsBanner'
import { SmartPriorityBadge } from '@/features/priority/SmartPriorityBadge'
import {
  WorkboardStatusControl,
  useStatusLabels,
  type ObligationStatus,
} from '@/features/workboard/status-control'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'
import { formatCents, formatDate, formatDateTimeWithTimezone } from '@/lib/utils'

type DashboardExposureStatus = DashboardTopRow['exposureStatus']
type DashboardStatusFilter = 'pending' | 'in_progress' | 'waiting_on_client' | 'review'
type DashboardFilterState = {
  client: string[]
  taxType: string[]
  due: DashboardDueBucket[]
  status: DashboardStatusFilter[]
  severity: DashboardSeverity[]
  exposure: DashboardExposureStatus[]
  evidence: DashboardEvidenceFilter[]
}
type DashboardFilterOptions = {
  clients: TableFilterOption[]
  taxTypes: TableFilterOption[]
  due: TableFilterOption[]
  status: TableFilterOption[]
  severity: TableFilterOption[]
  exposure: TableFilterOption[]
  evidence: TableFilterOption[]
}
type DashboardQueryPatch = Partial<{
  client: string[] | null
  taxType: string[] | null
  due: DashboardDueBucket[] | null
  status: DashboardStatusFilter[] | null
  severity: DashboardSeverity[] | null
  exposure: DashboardExposureStatus[] | null
  evidence: DashboardEvidenceFilter[] | null
}>
type DashboardBriefCitation = NonNullable<DashboardBriefPublic['citations']>[number]
const TRIAGE_TAB_KEYS = ['this_week', 'this_month', 'long_term'] as const
const DASHBOARD_DUE_BUCKETS = [
  'overdue',
  'today',
  'next_7_days',
  'next_30_days',
  'long_term',
] as const satisfies readonly DashboardDueBucket[]
const DASHBOARD_STATUS_FILTERS = [
  'pending',
  'in_progress',
  'waiting_on_client',
  'review',
] as const satisfies readonly ObligationStatus[]
const DASHBOARD_EXPOSURE_STATUSES = [
  'ready',
  'needs_input',
  'unsupported',
] as const satisfies readonly DashboardExposureStatus[]
const DASHBOARD_EVIDENCE_FILTERS = [
  'needs',
  'linked',
] as const satisfies readonly DashboardEvidenceFilter[]
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REPLACE_HISTORY_OPTIONS = { history: 'replace' } as const

const dashboardSearchParamsParsers = {
  asOfDate: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  triage: parseAsStringLiteral(TRIAGE_TAB_KEYS)
    .withDefault('this_week')
    .withOptions(REPLACE_HISTORY_OPTIONS),
  client: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  taxType: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  due: parseAsArrayOf(parseAsStringLiteral(DASHBOARD_DUE_BUCKETS))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  status: parseAsArrayOf(parseAsStringLiteral(DASHBOARD_STATUS_FILTERS))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  severity: parseAsArrayOf(parseAsStringLiteral(['critical', 'high', 'medium', 'neutral']))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  exposure: parseAsArrayOf(parseAsStringLiteral(DASHBOARD_EXPOSURE_STATUSES))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  evidence: parseAsArrayOf(parseAsStringLiteral(DASHBOARD_EVIDENCE_FILTERS))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
} as const

function isTriageTabKey(value: string): value is DashboardTriageTabKey {
  return (TRIAGE_TAB_KEYS as readonly string[]).includes(value)
}

function isDashboardDueBucket(value: string): value is DashboardDueBucket {
  return (DASHBOARD_DUE_BUCKETS as readonly string[]).includes(value)
}

function isDashboardStatus(value: string): value is (typeof DASHBOARD_STATUS_FILTERS)[number] {
  return (DASHBOARD_STATUS_FILTERS as readonly string[]).includes(value)
}

function isDashboardSeverity(value: string): value is DashboardSeverity {
  return ['critical', 'high', 'medium', 'neutral'].includes(value)
}

function isDashboardExposureStatus(value: string): value is DashboardTopRow['exposureStatus'] {
  return (DASHBOARD_EXPOSURE_STATUSES as readonly string[]).includes(value)
}

function isDashboardEvidenceFilter(value: string): value is DashboardEvidenceFilter {
  return (DASHBOARD_EVIDENCE_FILTERS as readonly string[]).includes(value)
}

const severityVariant: Record<
  DashboardSeverity,
  'destructive' | 'warning' | 'secondary' | 'outline'
> = {
  critical: 'destructive',
  high: 'warning',
  medium: 'secondary',
  neutral: 'outline',
}
const severityDot: Record<DashboardSeverity, 'error' | 'warning' | 'disabled' | 'normal'> = {
  critical: 'error',
  high: 'warning',
  medium: 'disabled',
  neutral: 'normal',
}
const severitySortValue: Record<DashboardSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  neutral: 0,
}

const dashboardDateSortingFn: SortingFn<DashboardTopRow> = (rowA, rowB, columnId) =>
  rowA.getValue<string>(columnId).localeCompare(rowB.getValue<string>(columnId))

const dashboardExposureSortingFn: SortingFn<DashboardTopRow> = (rowA, rowB) =>
  exposureSortValue(rowA.original) - exposureSortValue(rowB.original)

const dashboardSeveritySortingFn: SortingFn<DashboardTopRow> = (rowA, rowB, columnId) =>
  severitySortValue[rowA.getValue<DashboardSeverity>(columnId)] -
  severitySortValue[rowB.getValue<DashboardSeverity>(columnId)]

function exposureSortValue(row: DashboardTopRow): number {
  if (row.exposureStatus === 'ready' && row.estimatedExposureCents !== null) {
    return row.estimatedExposureCents
  }
  return -1
}

function useSeverityLabels(): Record<DashboardSeverity, string> {
  const { t } = useLingui()
  return {
    critical: t`critical`,
    high: t`high`,
    medium: t`medium`,
    neutral: t`neutral`,
  }
}

function useTriageTabLabels(): Record<DashboardTriageTabKey, string> {
  const { t } = useLingui()
  return {
    this_week: t`This Week`,
    this_month: t`This Month`,
    long_term: t`Long-term`,
  }
}

function useDueBucketLabels(): Record<DashboardDueBucket, string> {
  const { t } = useLingui()
  return useMemo(
    () => ({
      overdue: t`Overdue`,
      today: t`Today`,
      next_7_days: t`Next 7 days`,
      next_30_days: t`Next 30 days`,
      long_term: t`Long-term`,
    }),
    [t],
  )
}

function useExposureStatusLabels(): Record<DashboardTopRow['exposureStatus'], string> {
  const { t } = useLingui()
  return useMemo(
    () => ({
      ready: t`Ready`,
      needs_input: t`Needs input`,
      unsupported: t`Unsupported`,
    }),
    [t],
  )
}

function useEvidenceFilterLabels(): Record<DashboardEvidenceFilter, string> {
  const { t } = useLingui()
  return useMemo(
    () => ({
      needs: t`Needs evidence`,
      linked: t`Evidence linked`,
    }),
    [t],
  )
}

function ExposureBadge({ row }: { row: DashboardTopRow }) {
  if (row.exposureStatus === 'ready' && row.estimatedExposureCents !== null) {
    return (
      <Badge variant="warning" className="font-mono tabular-nums">
        {formatCents(row.estimatedExposureCents)}
      </Badge>
    )
  }
  if (row.exposureStatus === 'needs_input') {
    return (
      <Badge variant="info">
        <Trans>needs input</Trans>
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Trans>unsupported</Trans>
    </Badge>
  )
}

function DashboardSortableFilterHeader({
  children,
  column,
  sortLabel,
}: {
  children: ReactNode
  column: Column<DashboardTopRow>
  sortLabel: string
}) {
  const sortDirection = column.getIsSorted()
  const SortIcon =
    sortDirection === 'asc'
      ? ArrowUpIcon
      : sortDirection === 'desc'
        ? ArrowDownIcon
        : ArrowUpDownIcon

  return (
    <div className="flex min-w-0 items-center gap-1">
      {children}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={sortLabel}
        aria-pressed={sortDirection !== false}
        data-active={sortDirection !== false ? true : undefined}
        className="size-7 text-text-tertiary hover:text-text-primary data-[active=true]:text-text-accent"
        onClick={column.getToggleSortingHandler()}
      >
        <SortIcon className="size-3.5" aria-hidden />
      </Button>
    </div>
  )
}

function cleanStringFilters(values: readonly string[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value.length <= 120),
    ),
  ].slice(0, DASHBOARD_FILTER_MAX_SELECTIONS)
}

function cleanEntityIdFilters(values: readonly string[]): string[] {
  return cleanStringFilters(values).filter((value) => UUID_RE.test(value))
}

function enumOptionsFromFacets<T extends string>(
  values: readonly T[],
  facets: DashboardFacetsOutput | undefined,
  facetKey: 'dueBuckets' | 'statuses' | 'severities' | 'exposureStatuses' | 'evidence',
  labels: Record<T, string>,
): TableFilterOption[] {
  const counts = new Map<string, number>(
    (facets?.[facetKey] ?? []).map((option) => [option.value, option.count]),
  )
  return values.map((value) => ({ value, label: labels[value], count: counts.get(value) ?? 0 }))
}

export function DashboardRoute() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { openWizard } = useMigrationWizard()
  const { openEvidence } = useEvidenceDrawer()
  const severityLabels = useSeverityLabels()
  const triageTabLabels = useTriageTabLabels()
  const dueBucketLabels = useDueBucketLabels()
  const exposureStatusLabels = useExposureStatusLabels()
  const evidenceFilterLabels = useEvidenceFilterLabels()
  const statusLabels = useStatusLabels()
  const [
    { asOfDate, triage, client, taxType, due, status: statusFilter, severity, exposure, evidence },
    setDashboardQuery,
  ] = useQueryStates(dashboardSearchParamsParsers)
  const dashboardAsOfDate = ISO_DATE_RE.test(asOfDate) ? asOfDate : null
  const clientQuery = useMemo(() => cleanEntityIdFilters(client), [client])
  const taxTypeQuery = useMemo(() => cleanStringFilters(taxType), [taxType])
  const dashboardTableInput = useMemo<DashboardLoadInput>(
    () => ({
      topLimit: 20,
      ...(dashboardAsOfDate ? { asOfDate: dashboardAsOfDate } : {}),
      ...(clientQuery.length > 0 ? { clientIds: clientQuery } : {}),
      ...(taxTypeQuery.length > 0 ? { taxTypes: taxTypeQuery } : {}),
      ...(due.length > 0 ? { dueBuckets: due } : {}),
      ...(statusFilter.length > 0 ? { status: statusFilter } : {}),
      ...(severity.length > 0 ? { severity } : {}),
      ...(exposure.length > 0 ? { exposureStatus: exposure } : {}),
      ...(evidence.length > 0 ? { evidence } : {}),
    }),
    [clientQuery, dashboardAsOfDate, due, evidence, exposure, severity, statusFilter, taxTypeQuery],
  )
  const dashboardQuery = useQuery({
    ...orpc.dashboard.load.queryOptions({ input: dashboardTableInput }),
    placeholderData: keepPreviousData,
  })
  const updateStatusMutation = useMutation(
    orpc.obligations.updateStatus.mutationOptions({
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: orpc.dashboard.load.key() })
        void queryClient.invalidateQueries({ queryKey: orpc.workboard.list.key() })
        void queryClient.invalidateQueries({ queryKey: orpc.audit.key() })
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
  const refreshBriefMutation = useMutation(
    orpc.dashboard.requestBriefRefresh.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.dashboard.load.key() })
      },
    }),
  )
  const data = dashboardQuery.data
  const refreshSubmittedAt = refreshBriefMutation.submittedAt
  const briefSettledAfterRefresh =
    refreshSubmittedAt > 0 && data?.brief?.generatedAt
      ? Date.parse(data.brief.generatedAt) >= refreshSubmittedAt
      : false
  const isBriefQueued =
    refreshBriefMutation.isPending ||
    (refreshBriefMutation.data?.queued === true && !briefSettledAfterRefresh)

  const triageTabs = data?.triageTabs ?? []
  const topRows = data?.topRows ?? []
  const selectedTriageTab = triageTabs.find((tab) => tab.key === triage) ?? triageTabs[0] ?? null
  const facets = data?.facets
  const clientOptions = useMemo<TableFilterOption[]>(
    () =>
      facets?.clients.map((option) => ({
        value: option.value,
        label: option.label,
        count: option.count,
      })) ?? [],
    [facets?.clients],
  )
  const taxTypeOptions = useMemo<TableFilterOption[]>(
    () =>
      facets?.taxTypes.map((option) => ({
        value: option.value,
        label: option.label,
        count: option.count,
      })) ?? [],
    [facets?.taxTypes],
  )
  const dueOptions = useMemo(
    () => enumOptionsFromFacets(DASHBOARD_DUE_BUCKETS, facets, 'dueBuckets', dueBucketLabels),
    [dueBucketLabels, facets],
  )
  const statusOptions = useMemo(
    () => enumOptionsFromFacets(DASHBOARD_STATUS_FILTERS, facets, 'statuses', statusLabels),
    [facets, statusLabels],
  )
  const severityOptions = useMemo(
    () =>
      enumOptionsFromFacets(
        ['critical', 'high', 'medium', 'neutral'] as const,
        facets,
        'severities',
        severityLabels,
      ),
    [facets, severityLabels],
  )
  const exposureOptions = useMemo(
    () =>
      enumOptionsFromFacets(
        DASHBOARD_EXPOSURE_STATUSES,
        facets,
        'exposureStatuses',
        exposureStatusLabels,
      ),
    [exposureStatusLabels, facets],
  )
  const evidenceOptions = useMemo(
    () =>
      enumOptionsFromFacets(DASHBOARD_EVIDENCE_FILTERS, facets, 'evidence', evidenceFilterLabels),
    [evidenceFilterLabels, facets],
  )
  const filtersDisabled = dashboardQuery.isLoading && !data

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <Trans>Operations command</Trans>
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              <Trans>Deadline risk workbench</Trans>
            </h1>
            <p className="max-w-3xl text-md text-text-secondary">
              <Trans>
                Start with the money and deadline pressure, then work the evidence-backed triage
                queue.
              </Trans>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono tabular-nums text-xs">
            {dashboardQuery.isLoading ? <Trans>Loading…</Trans> : data?.asOfDate}
          </Badge>
          <Button variant="outline" size="sm" onClick={openWizard}>
            <FileSearchIcon data-icon="inline-start" />
            <Trans>Run migration</Trans>
          </Button>
          <Button size="sm" onClick={() => void navigate('/workboard')}>
            <Trans>Review risk queue</Trans>
            <ArrowUpRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </header>

      {dashboardQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Couldn't load dashboard</Trans>
          </AlertTitle>
          <AlertDescription>
            {rpcErrorMessage(dashboardQuery.error) ?? t`Please try again.`}{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void dashboardQuery.refetch()}
            >
              <Trans>Retry</Trans>
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div id="pulse">
        <PulseAlertsBanner />
      </div>

      <DashboardBriefPanel
        brief={data?.brief ?? null}
        topRows={topRows}
        summary={data?.summary ?? null}
        isLoading={dashboardQuery.isLoading}
        isQueued={isBriefQueued}
        onOpenEvidence={(citation) => {
          const citedRow = topRows.find((item) => item.obligationId === citation.obligationId)
          openEvidence({
            obligationId: citation.obligationId,
            label: citedRow ? `${citedRow.clientName} - ${citedRow.taxType}` : t`Obligation`,
            focusEvidenceId: citation.evidence?.id ?? null,
          })
        }}
        onRefresh={() => refreshBriefMutation.mutate({ scope: 'firm' })}
      />

      <DashboardMetricStrip isLoading={dashboardQuery.isLoading} summary={data?.summary ?? null} />

      <section>
        <DashboardTriagePanel
          isLoading={dashboardQuery.isLoading}
          asOfDate={data?.asOfDate ?? null}
          tabs={triageTabs}
          selectedKey={selectedTriageTab?.key ?? triage}
          tabLabels={triageTabLabels}
          filtersDisabled={filtersDisabled}
          filterOptions={{
            clients: clientOptions,
            taxTypes: taxTypeOptions,
            due: dueOptions,
            status: statusOptions,
            severity: severityOptions,
            exposure: exposureOptions,
            evidence: evidenceOptions,
          }}
          filterState={{
            client: clientQuery,
            taxType: taxTypeQuery,
            due,
            status: statusFilter,
            severity,
            exposure,
            evidence,
          }}
          severityLabels={severityLabels}
          statusLabels={statusLabels}
          statusDisabled={updateStatusMutation.isPending}
          onSelect={(key) => void setDashboardQuery({ triage: key })}
          onFilterChange={(patch) => void setDashboardQuery(patch)}
          onOpenWizard={openWizard}
          onOpenWorkboard={(key) => void navigate(workboardHrefForTriage(key))}
          onOpenEvidence={(row) =>
            openEvidence({
              obligationId: row.obligationId,
              label: `${row.clientName} - ${row.taxType}`,
              focusEvidenceId: row.primaryEvidence?.id ?? null,
            })
          }
          onChangeStatus={(row, nextStatus) =>
            updateStatusMutation.mutate({ id: row.obligationId, status: nextStatus })
          }
        />
      </section>
    </div>
  )
}

function DashboardMetricStrip({
  isLoading,
  summary,
}: {
  isLoading: boolean
  summary: DashboardSummary | null
}) {
  const metrics = summary
    ? [
        {
          id: 'open',
          label: <Trans>Open obligations</Trans>,
          value: String(summary.openObligationCount),
          detail: <Trans>Active client deadlines in the operating window.</Trans>,
          valueClassName: 'text-text-primary',
        },
        {
          id: 'due',
          label: <Trans>Due this week</Trans>,
          value: String(summary.dueThisWeekCount),
          detail: <Trans>Includes overdue and next-seven-day obligations.</Trans>,
          valueClassName: 'text-severity-critical',
        },
        {
          id: 'review',
          label: <Trans>Needs review</Trans>,
          value: String(summary.needsReviewCount),
          detail: <Trans>Rows waiting for final human action.</Trans>,
          valueClassName: 'text-severity-high',
        },
        {
          id: 'evidence',
          label: (
            <ConceptLabel concept="evidenceGap">
              <Trans>Evidence gaps</Trans>
            </ConceptLabel>
          ),
          value: String(summary.evidenceGapCount),
          detail: <Trans>Rows that still need a source before review.</Trans>,
          valueClassName: 'text-severity-medium',
        },
        {
          id: 'exposure',
          label: (
            <ConceptLabel concept="penaltyRadar">
              <Trans>Penalty Radar</Trans>
            </ConceptLabel>
          ),
          value: formatCents(summary.totalExposureCents),
          detail: (
            <Trans>
              {summary.exposureReadyCount} ready · {summary.exposureNeedsInputCount} needs input ·{' '}
              {summary.exposureUnsupportedCount} unsupported
            </Trans>
          ),
          valueClassName: 'text-text-primary',
        },
      ]
    : []

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {isLoading
        ? [0, 1, 2, 3, 4].map((item) => (
            <Card key={item} size="sm">
              <CardContent className="grid gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))
        : metrics.map((metric) => (
            <Card key={metric.id} size="sm">
              <CardContent className="grid gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  {metric.label}
                </span>
                <span
                  className={cn(
                    'font-mono text-3xl font-semibold tabular-nums',
                    metric.valueClassName,
                  )}
                >
                  {metric.value}
                </span>
                <span className="text-sm text-text-secondary">{metric.detail}</span>
              </CardContent>
            </Card>
          ))}
    </section>
  )
}

function workboardHrefForTriage(key: DashboardTriageTabKey): string {
  if (key === 'this_week') return '/workboard?daysMax=7'
  if (key === 'this_month') return '/workboard?daysMin=8&daysMax=30'
  return '/workboard?daysMin=31&daysMax=180'
}

function daysUntilDueFromAsOf(dueDate: string, asOfDate: string | null): number {
  const asOf = new Date(`${asOfDate ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)
  const due = new Date(`${dueDate}T00:00:00.000Z`)
  return Math.floor((due.getTime() - asOf.getTime()) / (24 * 60 * 60 * 1000))
}

function DashboardCountdownBadge({ days }: { days: number }) {
  const variant = days <= 2 ? 'destructive' : days <= 7 ? 'warning' : 'outline'
  return (
    <Badge variant={variant} className="min-w-18 justify-start font-mono text-xs tabular-nums">
      {days === 0 ? (
        <Trans>Today</Trans>
      ) : days < 0 ? (
        <Plural value={Math.abs(days)} one="# day late" other="# days late" />
      ) : (
        <Plural value={days} one="# day" other="# days" />
      )}
    </Badge>
  )
}

function DashboardTriagePanel({
  isLoading,
  asOfDate,
  tabs,
  selectedKey,
  tabLabels,
  filtersDisabled,
  filterOptions,
  filterState,
  severityLabels,
  statusLabels,
  statusDisabled,
  onSelect,
  onFilterChange,
  onOpenWizard,
  onOpenWorkboard,
  onOpenEvidence,
  onChangeStatus,
}: {
  isLoading: boolean
  asOfDate: string | null
  tabs: DashboardTriageTab[]
  selectedKey: DashboardTriageTabKey
  tabLabels: Record<DashboardTriageTabKey, string>
  filtersDisabled: boolean
  filterOptions: DashboardFilterOptions
  filterState: DashboardFilterState
  severityLabels: Record<DashboardSeverity, string>
  statusLabels: Record<ObligationStatus, string>
  statusDisabled: boolean
  onSelect: (key: DashboardTriageTabKey) => void
  onFilterChange: (patch: DashboardQueryPatch) => void
  onOpenWizard: () => void
  onOpenWorkboard: (key: DashboardTriageTabKey) => void
  onOpenEvidence: (row: DashboardTopRow) => void
  onChangeStatus: (row: DashboardTopRow, status: ObligationStatus) => void
}) {
  const selectedTab = tabs.find((tab) => tab.key === selectedKey) ?? tabs[0] ?? null

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <ConceptLabel concept="triageQueue">
            <Trans>Triage queue</Trans>
          </ConceptLabel>
        </CardTitle>
        <CardDescription>
          <Trans>This Week, This Month, and Long-term risk windows from server aggregation.</Trans>
        </CardDescription>
        <CardAction>
          {selectedTab ? (
            <Badge variant="outline" className="font-mono tabular-nums">
              {formatCents(selectedTab.totalExposureCents)}
            </Badge>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : tabs.length === 0 || !selectedTab ? (
          <EmptyDashboard onOpenWizard={onOpenWizard} />
        ) : (
          <Tabs
            value={selectedTab.key}
            onValueChange={(value) => {
              if (isTriageTabKey(value)) onSelect(value)
            }}
            className="gap-4"
          >
            <TabsList variant="line">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                  <span>{tabLabels[tab.key]}</span>
                  <span className="font-mono tabular-nums">
                    {tab.count} · {formatCents(tab.totalExposureCents)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.key} value={tab.key}>
                <DashboardTriageTable
                  rows={tab.rows}
                  asOfDate={asOfDate}
                  filtersDisabled={filtersDisabled}
                  filterOptions={filterOptions}
                  filterState={filterState}
                  severityLabels={severityLabels}
                  statusLabels={statusLabels}
                  statusDisabled={statusDisabled}
                  onFilterChange={onFilterChange}
                  onOpenEvidence={onOpenEvidence}
                  onChangeStatus={onChangeStatus}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t border-divider-regular">
        <Button
          variant="primary"
          size="sm"
          disabled={!selectedTab}
          onClick={() => selectedTab && onOpenWorkboard(selectedTab.key)}
        >
          <Trans>Open full Workboard</Trans>
          <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function DashboardTriageTable({
  rows,
  asOfDate,
  filtersDisabled,
  filterOptions,
  filterState,
  severityLabels,
  statusLabels,
  statusDisabled,
  onFilterChange,
  onOpenEvidence,
  onChangeStatus,
}: {
  rows: DashboardTopRow[]
  asOfDate: string | null
  filtersDisabled: boolean
  filterOptions: DashboardFilterOptions
  filterState: DashboardFilterState
  severityLabels: Record<DashboardSeverity, string>
  statusLabels: Record<ObligationStatus, string>
  statusDisabled: boolean
  onFilterChange: (patch: DashboardQueryPatch) => void
  onOpenEvidence: (row: DashboardTopRow) => void
  onChangeStatus: (row: DashboardTopRow, status: ObligationStatus) => void
}) {
  const { t } = useLingui()
  const [openHeaderFilter, setOpenHeaderFilter] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])

  function setHeaderFilterOpen(filterId: string, nextOpen: boolean) {
    setOpenHeaderFilter((current) => (nextOpen ? filterId : current === filterId ? null : current))
  }

  const columns = useMemo<ColumnDef<DashboardTopRow>[]>(
    () => [
      {
        id: 'smartPriority',
        header: () => <ConceptLabel concept="smartPriority">{t`Priority`}</ConceptLabel>,
        enableSorting: false,
        cell: ({ row }) => <SmartPriorityBadge smartPriority={row.original.smartPriority} />,
      },
      {
        accessorKey: 'clientName',
        enableSorting: false,
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Client`}
            open={openHeaderFilter === 'client'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('client', nextOpen)}
            options={filterOptions.clients}
            selected={filterState.client}
            disabled={filtersDisabled}
            emptyLabel={t`No clients`}
            searchable
            searchPlaceholder={t`Search clients`}
            onSelectedChange={(nextClient) =>
              onFilterChange({ client: nextClient.length > 0 ? nextClient : null })
            }
          />
        ),
        cell: (info) => info.getValue<string>(),
      },
      {
        accessorKey: 'taxType',
        enableSorting: false,
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Tax type`}
            open={openHeaderFilter === 'taxType'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('taxType', nextOpen)}
            options={filterOptions.taxTypes}
            selected={filterState.taxType}
            disabled={filtersDisabled}
            emptyLabel={t`No forms`}
            onSelectedChange={(nextTaxType) =>
              onFilterChange({ taxType: nextTaxType.length > 0 ? nextTaxType : null })
            }
          />
        ),
        cell: (info) => info.getValue<string>(),
      },
      {
        accessorKey: 'currentDueDate',
        enableSorting: true,
        sortingFn: dashboardDateSortingFn,
        sortDescFirst: false,
        header: ({ column }) => {
          const label = t`Deadline`
          return (
            <DashboardSortableFilterHeader column={column} sortLabel={`${t`Sort`} ${label}`}>
              <TableHeaderMultiFilter
                trigger="header"
                label={label}
                open={openHeaderFilter === 'due'}
                onOpenChange={(nextOpen) => setHeaderFilterOpen('due', nextOpen)}
                options={filterOptions.due}
                selected={filterState.due}
                disabled={filtersDisabled}
                emptyLabel={t`No deadline windows`}
                onSelectedChange={(nextDue) => {
                  const typedDue = nextDue.filter(isDashboardDueBucket)
                  onFilterChange({ due: typedDue.length > 0 ? typedDue : null })
                }}
              />
            </DashboardSortableFilterHeader>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <DashboardCountdownBadge
              days={daysUntilDueFromAsOf(row.original.currentDueDate, asOfDate)}
            />
            <span className="text-xs">{formatDate(row.original.currentDueDate)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        enableSorting: false,
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Status`}
            open={openHeaderFilter === 'status'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('status', nextOpen)}
            options={filterOptions.status}
            selected={filterState.status}
            disabled={filtersDisabled}
            emptyLabel={t`No statuses`}
            onSelectedChange={(nextStatus) => {
              const typedStatus = nextStatus.filter(isDashboardStatus)
              onFilterChange({ status: typedStatus.length > 0 ? typedStatus : null })
            }}
          />
        ),
        cell: ({ row }) => (
          <WorkboardStatusControl
            row={{
              id: row.original.obligationId,
              clientName: row.original.clientName,
              status: row.original.status,
            }}
            labels={statusLabels}
            disabled={statusDisabled}
            onChange={(_, status) => onChangeStatus(row.original, status)}
          />
        ),
      },
      {
        accessorKey: 'severity',
        enableSorting: true,
        sortingFn: dashboardSeveritySortingFn,
        sortDescFirst: true,
        header: ({ column }) => {
          const label = t`Severity`
          return (
            <DashboardSortableFilterHeader column={column} sortLabel={`${t`Sort`} ${label}`}>
              <TableHeaderMultiFilter
                trigger="header"
                label={label}
                open={openHeaderFilter === 'severity'}
                onOpenChange={(nextOpen) => setHeaderFilterOpen('severity', nextOpen)}
                options={filterOptions.severity}
                selected={filterState.severity}
                disabled={filtersDisabled}
                emptyLabel={t`No severities`}
                onSelectedChange={(nextSeverity) => {
                  const typedSeverity = nextSeverity.filter(isDashboardSeverity)
                  onFilterChange({ severity: typedSeverity.length > 0 ? typedSeverity : null })
                }}
              />
            </DashboardSortableFilterHeader>
          )
        },
        cell: ({ row }) => (
          <Badge
            variant={severityVariant[row.original.severity]}
            className="h-7 px-2.5 text-xs uppercase tracking-wide"
          >
            <BadgeStatusDot tone={severityDot[row.original.severity]} />
            {severityLabels[row.original.severity]}
          </Badge>
        ),
      },
      {
        accessorKey: 'estimatedExposureCents',
        enableSorting: true,
        sortingFn: dashboardExposureSortingFn,
        sortDescFirst: true,
        header: ({ column }) => {
          const label = t`Exposure`
          return (
            <DashboardSortableFilterHeader column={column} sortLabel={`${t`Sort`} ${label}`}>
              <TableHeaderMultiFilter
                trigger="header"
                label={label}
                open={openHeaderFilter === 'exposure'}
                onOpenChange={(nextOpen) => setHeaderFilterOpen('exposure', nextOpen)}
                options={filterOptions.exposure}
                selected={filterState.exposure}
                disabled={filtersDisabled}
                emptyLabel={t`No exposure states`}
                onSelectedChange={(nextExposure) => {
                  const typedExposure = nextExposure.filter(isDashboardExposureStatus)
                  onFilterChange({ exposure: typedExposure.length > 0 ? typedExposure : null })
                }}
              />
            </DashboardSortableFilterHeader>
          )
        },
        cell: ({ row }) => <ExposureBadge row={row.original} />,
      },
      {
        accessorKey: 'evidenceCount',
        enableSorting: false,
        header: () => (
          <TableHeaderMultiFilter
            trigger="header"
            label={t`Evidence`}
            open={openHeaderFilter === 'evidence'}
            onOpenChange={(nextOpen) => setHeaderFilterOpen('evidence', nextOpen)}
            options={filterOptions.evidence}
            selected={filterState.evidence}
            disabled={filtersDisabled}
            emptyLabel={t`No evidence states`}
            onSelectedChange={(nextEvidence) => {
              const typedEvidence = nextEvidence.filter(isDashboardEvidenceFilter)
              onFilterChange({ evidence: typedEvidence.length > 0 ? typedEvidence : null })
            }}
          />
        ),
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            aria-label={t`Open evidence for ${row.original.clientName}`}
            onClick={() => onOpenEvidence(row.original)}
          >
            <FileSearchIcon data-icon="inline-start" />
            {row.original.evidenceCount > 0 ? (
              <Plural value={row.original.evidenceCount} one="# source" other="# sources" />
            ) : (
              t`Needs evidence`
            )}
          </Button>
        ),
      },
    ],
    [
      asOfDate,
      filterOptions,
      filterState,
      filtersDisabled,
      onChangeStatus,
      onFilterChange,
      onOpenEvidence,
      openHeaderFilter,
      severityLabels,
      statusDisabled,
      statusLabels,
      t,
    ],
  )
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.obligationId,
    manualFiltering: true,
    onSortingChange: setSorting,
  })
  const tableRows = table.getRowModel().rows
  const visibleColumnCount = table.getVisibleLeafColumns().length

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[980px]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  aria-sort={
                    header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : header.column.getCanSort()
                          ? 'none'
                          : undefined
                  }
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
          {tableRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="py-8 text-xs text-text-secondary">
                <Trans>No obligations in this window.</Trans>
              </TableCell>
            </TableRow>
          ) : (
            tableRows.map((tableRow) => (
              <TableRow key={tableRow.id} className={severityRowClass(tableRow.original.severity)}>
                {tableRow.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === 'clientName'
                        ? 'font-medium'
                        : cell.column.id === 'taxType'
                          ? 'text-text-secondary'
                          : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function DashboardBriefPanel({
  brief,
  topRows,
  summary,
  isLoading,
  isQueued,
  onOpenEvidence,
  onRefresh,
}: {
  brief: DashboardBriefPublic | null
  topRows: DashboardTopRow[]
  summary: {
    openObligationCount: number
    dueThisWeekCount: number
    needsReviewCount: number
  } | null
  isLoading: boolean
  isQueued: boolean
  onOpenEvidence: (citation: DashboardBriefCitation) => void
  onRefresh: () => void
}) {
  const { t } = useLingui()
  const fallback = summary
    ? t`${summary.openObligationCount} open obligations, ${summary.dueThisWeekCount} due this week, and ${summary.needsReviewCount} need review.`
    : t`Dashboard risk summary will appear after clients and obligations are generated.`
  const isReady = brief?.status === 'ready' || brief?.status === 'stale'
  const statusLabel =
    isQueued || brief?.status === 'pending'
      ? t`Queued`
      : brief?.status === 'stale'
        ? t`Stale`
        : brief?.status === 'ready'
          ? t`Ready`
          : null
  const refreshDisabled = isQueued || brief?.status === 'pending'

  const updatedLabel = brief?.generatedAt
    ? t`Updated ${formatDateTimeWithTimezone(brief.generatedAt)}`
    : t`No prepared brief yet`

  return (
    <section className="grid gap-3 rounded-xl border border-components-card-border bg-components-card-bg px-4 py-3 text-md text-text-primary shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SparklesIcon className="size-4 text-text-accent" aria-hidden />
            <span className="text-md font-semibold text-text-primary">
              <ConceptLabel concept="aiWeeklyBrief">
                <Trans>AI weekly brief</Trans>
              </ConceptLabel>
            </span>
            {statusLabel ? (
              <Badge
                variant={
                  isQueued || brief?.status === 'pending'
                    ? 'warning'
                    : brief?.status === 'stale'
                      ? 'warning'
                      : 'outline'
                }
              >
                {statusLabel}
              </Badge>
            ) : null}
            <span className="font-mono text-xs tabular-nums text-text-muted">{updatedLabel}</span>
          </div>
          <p className="mt-1 text-sm text-text-tertiary">
            <Trans>Prepared in the background from the latest dashboard risk snapshot.</Trans>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshDisabled}
          aria-label={t`Refresh AI weekly brief`}
          className="shrink-0"
        >
          <RefreshCwIcon data-icon="inline-start" />
          {isQueued || brief?.status === 'pending' ? (
            <Trans>Queued</Trans>
          ) : (
            <Trans>Refresh brief</Trans>
          )}
        </Button>
      </div>
      <div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="size-2 rounded-full bg-divider-deep" aria-hidden />
            <Trans>Checking for the latest prepared brief…</Trans>
          </div>
        ) : isQueued || brief?.status === 'pending' ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span
              className="size-2 rounded-full bg-components-badge-status-light-warning-bg"
              aria-hidden
            />
            <Trans>Brief is being prepared. The risk table is ready now.</Trans>
          </div>
        ) : isReady && brief?.text ? (
          <div className="flex flex-col gap-4">
            <div className="whitespace-pre-wrap text-sm leading-6 text-text-primary">
              {brief.text}
            </div>
            <DashboardBriefCitations
              citations={brief.citations ?? []}
              topRows={topRows}
              onSelectCitation={onOpenEvidence}
            />
          </div>
        ) : (
          <div className="text-sm leading-6 text-text-secondary">{fallback}</div>
        )}
      </div>
    </section>
  )
}

function DashboardBriefCitations({
  citations,
  topRows,
  onSelectCitation,
}: {
  citations: NonNullable<DashboardBriefPublic['citations']>
  topRows: DashboardTopRow[]
  onSelectCitation: (citation: DashboardBriefCitation) => void
}) {
  const { t } = useLingui()
  if (citations.length === 0) return null
  const rowsById = new Map(topRows.map((row) => [row.obligationId, row]))

  return (
    <div className="flex flex-wrap gap-2">
      {citations.map((citation) => {
        const row = rowsById.get(citation.obligationId)
        const label = row ? row.clientName : t`Obligation`
        return (
          <div key={`${citation.ref}:${citation.obligationId}`} className="flex items-center gap-1">
            <Badge
              variant="outline"
              render={
                <button
                  type="button"
                  onClick={() => onSelectCitation(citation)}
                  aria-label={t`Open evidence for ${label}`}
                />
              }
            >
              <FileSearchIcon data-icon="inline-start" />
              {`[${citation.ref}] ${label}`}
            </Badge>
            {citation.evidence?.sourceUrl ? (
              <Badge
                variant="link"
                render={
                  <a
                    href={citation.evidence.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t`Open source ${citation.evidence.sourceType}`}
                  />
                }
              >
                <ArrowUpRightIcon data-icon="inline-start" />
                {citation.evidence.sourceType}
              </Badge>
            ) : citation.evidence ? (
              <Badge variant="secondary">{citation.evidence.sourceType}</Badge>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function EmptyDashboard({ onOpenWizard }: { onOpenWizard: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-divider-regular px-6 py-10 text-center">
      <span className="text-md font-semibold text-text-primary">
        <Trans>No generated obligations yet.</Trans>
      </span>
      <p className="max-w-105 text-sm text-text-secondary">
        <Trans>Run Migration Copilot to import clients and generate real deadlines.</Trans>
      </p>
      <Button size="sm" onClick={onOpenWizard}>
        <FileSearchIcon data-icon="inline-start" />
        <Trans>Run migration</Trans>
      </Button>
    </div>
  )
}
