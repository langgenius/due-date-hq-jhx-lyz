import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  FileSearchIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { useNavigate } from 'react-router'

import type { DashboardBriefPublic, DashboardSeverity, DashboardTopRow } from '@duedatehq/contracts'
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
import { RiskBanner } from '@/components/primitives/risk-banner'
import { severityRowClass } from '@/components/primitives/severity-row'
import { useMigrationWizard } from '@/features/migration/WizardProvider'
import { PulseAlertsBanner } from '@/features/pulse/PulseAlertsBanner'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'
import { formatDate } from '@/lib/utils'

type QueueStat = {
  label: string
  value: string
  detail: string
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

function formatEvidence(row: DashboardTopRow, t: ReturnType<typeof useLingui>['t']): string {
  if (row.evidenceCount === 0) return t`Needs evidence`
  return row.primaryEvidence?.sourceType ?? t`Evidence linked`
}

export function DashboardRoute() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { openWizard } = useMigrationWizard()
  const severityLabels = useSeverityLabels()
  const dashboardQuery = useQuery(orpc.dashboard.load.queryOptions({ input: {} }))
  const refreshBriefMutation = useMutation(
    orpc.dashboard.requestBriefRefresh.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.dashboard.load.key() })
      },
    }),
  )
  const data = dashboardQuery.data

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
        summary={data?.summary ?? null}
        isLoading={dashboardQuery.isLoading}
        isRefreshing={refreshBriefMutation.isPending}
        onRefresh={() => refreshBriefMutation.mutate({ scope: 'firm' })}
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
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
        <Tabs defaultValue="risk" className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="risk">
              <Trans>Risk table</Trans>
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <Trans>Evidence checks</Trans>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="risk">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Client risk rows</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Top obligations are sorted by deterministic due-date severity.</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardQuery.isLoading ? (
                  <div className="grid gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : topRows.length === 0 ? (
                  <EmptyDashboard onOpenWizard={openWizard} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t`Client`}</TableHead>
                        <TableHead>{t`Tax type`}</TableHead>
                        <TableHead>{t`Deadline`}</TableHead>
                        <TableHead>{t`Status`}</TableHead>
                        <TableHead>{t`Severity`}</TableHead>
                        <TableHead>{t`Evidence`}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRows.map((row) => (
                        <TableRow key={row.obligationId} className={severityRowClass(row.severity)}>
                          <TableCell className="font-medium">{row.clientName}</TableCell>
                          <TableCell className="text-text-secondary">{row.taxType}</TableCell>
                          <TableCell className="font-mono tabular-nums">
                            {formatDate(row.currentDueDate)}
                          </TableCell>
                          <TableCell>{row.status}</TableCell>
                          <TableCell>
                            <Badge
                              variant={severityVariant[row.severity]}
                              className="h-7 px-2.5 text-md uppercase tracking-wide"
                            >
                              <BadgeStatusDot tone={severityDot[row.severity]} />
                              {severityLabels[row.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.evidenceCount > 0 ? 'outline' : 'warning'}>
                              {row.evidenceCount > 0 ? (
                                <Plural
                                  value={row.evidenceCount}
                                  one="# source"
                                  other="# sources"
                                />
                              ) : (
                                t`Needs evidence`
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Evidence checks</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Coverage state for the same obligations shown on the dashboard.</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Alert>
                  <CheckCircle2Icon />
                  <AlertTitle>
                    <Trans>Linked</Trans>
                  </AlertTitle>
                  <AlertDescription>
                    <Trans>
                      {topRows.filter((row) => row.evidenceCount > 0).length} top rows have
                      evidence.
                    </Trans>
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircleIcon />
                  <AlertTitle>
                    <Trans>Needs evidence</Trans>
                  </AlertTitle>
                  <AlertDescription>
                    <Trans>
                      {data?.summary.evidenceGapCount ?? 0} open obligations have no evidence link.
                    </Trans>
                  </AlertDescription>
                </Alert>
                <Alert
                  variant={data && data.summary.needsReviewCount > 0 ? 'destructive' : 'default'}
                >
                  <AlertCircleIcon />
                  <AlertTitle>
                    <Trans>Needs review</Trans>
                  </AlertTitle>
                  <AlertDescription>
                    <Trans>
                      {data?.summary.needsReviewCount ?? 0} obligations require CPA confirmation.
                    </Trans>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

function DashboardBriefPanel({
  brief,
  summary,
  isLoading,
  isRefreshing,
  onRefresh,
}: {
  brief: DashboardBriefPublic | null
  summary: {
    openObligationCount: number
    dueThisWeekCount: number
    needsReviewCount: number
  } | null
  isLoading: boolean
  isRefreshing: boolean
  onRefresh: () => void
}) {
  const { t } = useLingui()
  const fallback = summary
    ? t`${summary.openObligationCount} open obligations, ${summary.dueThisWeekCount} due this week, and ${summary.needsReviewCount} need review.`
    : t`Dashboard risk summary will appear after clients and obligations are generated.`
  const isReady = brief?.status === 'ready' || brief?.status === 'stale'
  const statusLabel =
    brief?.status === 'stale' ? t`Stale` : brief?.status === 'ready' ? t`Ready` : null
  const refreshDisabled = isRefreshing || brief?.status === 'pending'

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
            <Badge variant={brief?.status === 'stale' ? 'warning' : 'outline'}>{statusLabel}</Badge>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="size-2 rounded-full bg-divider-deep" aria-hidden />
            <Trans>Checking for the latest prepared brief…</Trans>
          </div>
        ) : isReady && brief?.text ? (
          <div className="whitespace-pre-wrap text-sm leading-6 text-text-primary">
            {brief.text}
          </div>
        ) : brief?.status === 'pending' ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="size-2 rounded-full bg-state-accent-solid" aria-hidden />
            <Trans>Brief is being prepared. The risk table is ready now.</Trans>
          </div>
        ) : (
          <div className="text-sm leading-6 text-text-secondary">{fallback}</div>
        )}
      </CardContent>
      <CardFooter className="justify-between gap-3 border-t border-divider-regular">
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {brief?.generatedAt ? t`Updated ${brief.generatedAt}` : t`No prepared brief yet`}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshDisabled}
          aria-label={t`Refresh AI weekly brief`}
        >
          <RefreshCwIcon data-icon="inline-start" />
          {isRefreshing || brief?.status === 'pending' ? (
            <Trans>Queued</Trans>
          ) : (
            <Trans>Refresh brief</Trans>
          )}
        </Button>
      </CardFooter>
    </Card>
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
