import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  FileSearchIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import type {
  DashboardBriefPublic,
  DashboardSeverity,
  DashboardTopRow,
  DashboardTriageTab,
  DashboardTriageTabKey,
} from '@duedatehq/contracts'
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
import { Separator } from '@duedatehq/ui/components/ui/separator'
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
import { RiskBanner } from '@/features/dashboard/risk-banner'
import { severityRowClass } from '@/features/dashboard/severity-row'
import { useEvidenceDrawer } from '@/features/evidence/EvidenceDrawerProvider'
import { useMigrationWizard } from '@/features/migration/WizardProvider'
import { PulseAlertsBanner } from '@/features/pulse/PulseAlertsBanner'
import {
  WorkboardStatusControl,
  useStatusLabels,
  type ObligationStatus,
} from '@/features/workboard/status-control'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'
import { formatCents, formatDate, formatDateTimeWithTimezone } from '@/lib/utils'

type QueueStat = {
  label: string
  value: string
  detail: string
}
type DashboardBriefCitation = NonNullable<DashboardBriefPublic['citations']>[number]
const TRIAGE_TAB_KEYS = ['this_week', 'this_month', 'long_term'] as const
const REPLACE_HISTORY_OPTIONS = { history: 'replace' } as const

const dashboardSearchParamsParsers = {
  triage: parseAsStringLiteral(TRIAGE_TAB_KEYS)
    .withDefault('this_week')
    .withOptions(REPLACE_HISTORY_OPTIONS),
} as const

function isTriageTabKey(value: string): value is DashboardTriageTabKey {
  return (TRIAGE_TAB_KEYS as readonly string[]).includes(value)
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

function formatEvidence(row: DashboardTopRow, t: ReturnType<typeof useLingui>['t']): string {
  if (row.evidenceCount === 0) return t`Needs evidence`
  return row.primaryEvidence?.sourceType ?? t`Evidence linked`
}

function ExposureSummaryBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-divider-subtle p-3">
      <div className="font-mono text-xl font-semibold tabular-nums text-text-primary">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{label}</div>
    </div>
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

export function DashboardRoute() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { openWizard } = useMigrationWizard()
  const { openEvidence } = useEvidenceDrawer()
  const severityLabels = useSeverityLabels()
  const triageTabLabels = useTriageTabLabels()
  const statusLabels = useStatusLabels()
  const [{ triage }, setDashboardQuery] = useQueryStates(dashboardSearchParamsParsers)
  const dashboardQuery = useQuery(orpc.dashboard.load.queryOptions({ input: {} }))
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

  const queueStats: QueueStat[] = data
    ? [
        {
          label: t`Open risk`,
          value: String(data.summary.openObligationCount),
          detail: t`open obligations`,
        },
        {
          label: t`Due this week`,
          value: String(data.summary.dueThisWeekCount),
          detail: t`obligations`,
        },
        {
          label: t`Needs evidence`,
          value: String(data.summary.evidenceGapCount),
          detail: t`source gaps`,
        },
      ]
    : []
  const topRows = data?.topRows ?? []
  const visibleBanners = topRows.slice(0, 3)
  const triageTabs = data?.triageTabs ?? []
  const selectedTriageTab = triageTabs.find((tab) => tab.key === triage) ?? triageTabs[0] ?? null

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Trans>Operations</Trans>
        </span>
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

      <PulseAlertsBanner />

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

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Penalty Radar</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Estimated exposure in the current operating window.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {dashboardQuery.isLoading ? (
              <Skeleton className="h-16 w-44" />
            ) : (
              <div className="flex flex-col gap-2">
                <span className="font-mono text-hero font-semibold tabular-nums">
                  {formatCents(data?.summary.totalExposureCents ?? 0)}
                </span>
                <span className="text-sm text-text-secondary">
                  <Trans>at risk this week</Trans>
                </span>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-3">
              <ExposureSummaryBadge
                label={t`Ready`}
                value={data?.summary.exposureReadyCount ?? 0}
              />
              <ExposureSummaryBadge
                label={t`Needs input`}
                value={data?.summary.exposureNeedsInputCount ?? 0}
              />
              <ExposureSummaryBadge
                label={t`Unsupported`}
                value={data?.summary.exposureUnsupportedCount ?? 0}
              />
            </div>
          </CardContent>
        </Card>

        <Card id="pulse">
          <CardHeader>
            <CardTitle>
              <Trans>Risk pulse</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Server-computed obligation risk for the next operating window.</Trans>
            </CardDescription>
            <CardAction>
              <Badge variant="outline" className="font-mono tabular-nums">
                {dashboardQuery.isLoading ? <Trans>Loading…</Trans> : data?.asOfDate}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  <Trans>Open obligations</Trans>
                </span>
                {dashboardQuery.isLoading ? (
                  <Skeleton className="h-14 w-28" />
                ) : (
                  <span className="font-mono text-hero leading-none font-semibold tabular-nums">
                    {data?.summary.openObligationCount ?? 0}
                  </span>
                )}
                <span className="text-md text-text-secondary">
                  {data ? (
                    <Trans>Across {data.summary.dueThisWeekCount} due this week.</Trans>
                  ) : (
                    <Trans>Loading real deadline risk.</Trans>
                  )}
                </span>
              </div>
              <div className="grid gap-3">
                {dashboardQuery.isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : visibleBanners.length > 0 ? (
                  visibleBanners.map((row) => (
                    <RiskBanner
                      key={row.obligationId}
                      title={row.clientName}
                      detail={t`${row.taxType} due ${formatDate(row.currentDueDate)}`}
                      source={
                        <Badge variant={row.evidenceCount > 0 ? 'outline' : 'warning'}>
                          {formatEvidence(row, t)}
                        </Badge>
                      }
                    />
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-divider-regular p-4 text-sm text-text-secondary">
                    <Trans>Import clients to generate real obligation risk.</Trans>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2 border-t border-divider-regular">
            <Button size="sm" onClick={() => void navigate('/workboard')}>
              <Trans>Review risk queue</Trans>
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="sm" onClick={openWizard}>
              <FileSearchIcon data-icon="inline-start" />
              <Trans>Run migration</Trans>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Today queue</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Operational pressure points from server aggregation.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboardQuery.isLoading
              ? [0, 1, 2].map((item) => <Skeleton key={item} className="h-12 w-full" />)
              : queueStats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-md font-medium">{stat.label}</span>
                      <span className="text-sm text-text-tertiary">{stat.detail}</span>
                    </div>
                    <span className="font-mono text-2xl font-semibold tabular-nums">
                      {stat.value}
                    </span>
                  </div>
                ))}
            <Separator />
            <Alert>
              <ShieldCheckIcon />
              <AlertTitle>
                <Trans>Glass-box threshold is active</Trans>
              </AlertTitle>
              <AlertDescription>
                <Trans>
                  Dashboard rows are sourced from obligations and evidence links, not demo arrays.
                </Trans>
              </AlertDescription>
            </Alert>
            <div className="grid gap-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <DashboardTriagePanel
          isLoading={dashboardQuery.isLoading}
          asOfDate={data?.asOfDate ?? null}
          tabs={triageTabs}
          selectedKey={selectedTriageTab?.key ?? triage}
          tabLabels={triageTabLabels}
          severityLabels={severityLabels}
          statusLabels={statusLabels}
          statusDisabled={updateStatusMutation.isPending}
          onSelect={(key) => void setDashboardQuery({ triage: key })}
          onOpenWizard={openWizard}
          onOpenWorkboard={(key) => void navigate(workboardHrefForTriage(key))}
          onOpenEvidence={(row) =>
            openEvidence({
              obligationId: row.obligationId,
              label: `${row.clientName} - ${row.taxType}`,
              focusEvidenceId: row.primaryEvidence?.id ?? null,
            })
          }
          onChangeStatus={(row, status) =>
            updateStatusMutation.mutate({ id: row.obligationId, status })
          }
        />
      </section>
    </div>
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
    <Badge variant={variant} className="min-w-18 justify-start font-mono text-[11px] tabular-nums">
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
  severityLabels,
  statusLabels,
  statusDisabled,
  onSelect,
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
  severityLabels: Record<DashboardSeverity, string>
  statusLabels: Record<ObligationStatus, string>
  statusDisabled: boolean
  onSelect: (key: DashboardTriageTabKey) => void
  onOpenWizard: () => void
  onOpenWorkboard: (key: DashboardTriageTabKey) => void
  onOpenEvidence: (row: DashboardTopRow) => void
  onChangeStatus: (row: DashboardTopRow, status: ObligationStatus) => void
}) {
  const { t } = useLingui()
  const selectedTab = tabs.find((tab) => tab.key === selectedKey) ?? tabs[0] ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Triage queue</Trans>
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
                {tab.rows.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-divider-regular p-6 text-sm text-text-secondary">
                    <Trans>No obligations in this window.</Trans>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t`Client`}</TableHead>
                        <TableHead>{t`Tax type`}</TableHead>
                        <TableHead>{t`Deadline`}</TableHead>
                        <TableHead>{t`Status`}</TableHead>
                        <TableHead>{t`Severity`}</TableHead>
                        <TableHead>{t`Exposure`}</TableHead>
                        <TableHead>{t`Evidence`}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tab.rows.map((row) => (
                        <TableRow key={row.obligationId} className={severityRowClass(row.severity)}>
                          <TableCell className="font-medium">{row.clientName}</TableCell>
                          <TableCell className="text-text-secondary">{row.taxType}</TableCell>
                          <TableCell className="font-mono tabular-nums">
                            <div className="flex items-center gap-2">
                              <DashboardCountdownBadge
                                days={daysUntilDueFromAsOf(row.currentDueDate, asOfDate)}
                              />
                              <span className="text-xs">{formatDate(row.currentDueDate)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <WorkboardStatusControl
                              row={{
                                id: row.obligationId,
                                clientName: row.clientName,
                                status: row.status,
                              }}
                              labels={statusLabels}
                              disabled={statusDisabled}
                              onChange={(_, status) => onChangeStatus(row, status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={severityVariant[row.severity]}
                              className="h-7 px-2.5 text-xs uppercase tracking-wide"
                            >
                              <BadgeStatusDot tone={severityDot[row.severity]} />
                              {severityLabels[row.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ExposureBadge row={row} />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={t`Open evidence for ${row.clientName}`}
                              onClick={() => onOpenEvidence(row)}
                            >
                              <FileSearchIcon data-icon="inline-start" />
                              {row.evidenceCount > 0 ? (
                                <Plural
                                  value={row.evidenceCount}
                                  one="# source"
                                  other="# sources"
                                />
                              ) : (
                                t`Needs evidence`
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t border-divider-regular">
        <Button
          variant="outline"
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-text-accent" aria-hidden />
          <Trans>AI weekly brief</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Prepared in the background from the latest dashboard risk snapshot.</Trans>
        </CardDescription>
        <CardAction>
          {statusLabel ? (
            <Badge
              variant={
                isQueued || brief?.status === 'pending'
                  ? 'info'
                  : brief?.status === 'stale'
                    ? 'warning'
                    : 'outline'
              }
            >
              {statusLabel}
            </Badge>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="size-2 rounded-full bg-divider-deep" aria-hidden />
            <Trans>Checking for the latest prepared brief…</Trans>
          </div>
        ) : isQueued || brief?.status === 'pending' ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="size-2 rounded-full bg-state-accent-solid" aria-hidden />
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
      </CardContent>
      <CardFooter className="justify-between gap-3 border-t border-divider-regular">
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {brief?.generatedAt
            ? t`Updated ${formatDateTimeWithTimezone(brief.generatedAt)}`
            : t`No prepared brief yet`}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshDisabled}
          aria-label={t`Refresh AI weekly brief`}
        >
          <RefreshCwIcon data-icon="inline-start" />
          {isQueued || brief?.status === 'pending' ? (
            <Trans>Queued</Trans>
          ) : (
            <Trans>Refresh brief</Trans>
          )}
        </Button>
      </CardFooter>
    </Card>
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
