import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  FileSearchIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge } from '@duedatehq/ui/components/ui/badge'
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
import { formatCents, formatDate } from '@/lib/utils'

function usePulseItems() {
  const { t } = useLingui()
  return [
    {
      title: t`IRS transcript mismatch`,
      detail: t`3 clients have estimated-tax deltas above the evidence threshold.`,
      source: 'IRS-2026-Q1',
    },
    {
      title: t`NY PTET election window`,
      detail: t`2 partner entities need review before the March 15 cutoff.`,
      source: 'NY-PTET-2026',
    },
    {
      title: t`Extension package hold`,
      detail: t`5 draft extensions are waiting on K-1 attachments.`,
      source: 'Firm-Outbox',
    },
  ]
}

const riskRows = [
  {
    client: 'Arbor & Vale LLC',
    obligation: 'Federal 1065 extension',
    deadline: '2026-03-15',
    exposure: 1840000,
    severity: 'critical',
    owner: 'M. Chen',
  },
  {
    client: 'Northstar Dental Group',
    obligation: 'State payroll deposit',
    deadline: '2026-03-18',
    exposure: 912500,
    severity: 'high',
    owner: 'A. Rivera',
  },
  {
    client: 'Copperline Studios',
    obligation: 'Sales tax reconciliation',
    deadline: '2026-03-20',
    exposure: 238900,
    severity: 'medium',
    owner: 'K. Patel',
  },
  {
    client: 'Lake Union Foods',
    obligation: '1099 correction batch',
    deadline: '2026-03-22',
    exposure: 94000,
    severity: 'neutral',
    owner: 'D. Brooks',
  },
  {
    client: 'Westbridge GP',
    obligation: 'Partner basis workpaper',
    deadline: '2026-03-25',
    exposure: 620000,
    severity: 'high',
    owner: 'M. Chen',
  },
  {
    client: 'Hale Robotics Inc.',
    obligation: 'R&D credit support',
    deadline: '2026-03-28',
    exposure: 305000,
    severity: 'medium',
    owner: 'S. Imani',
  },
  {
    client: 'Summit Care Partners',
    obligation: 'ACA filing review',
    deadline: '2026-03-31',
    exposure: 172000,
    severity: 'neutral',
    owner: 'K. Patel',
  },
  {
    client: 'Bluegrain Imports',
    obligation: 'Customs duty accrual',
    deadline: '2026-04-02',
    exposure: 746000,
    severity: 'high',
    owner: 'A. Rivera',
  },
] as const

function useQueueStats() {
  const { t } = useLingui()
  return [
    { label: t`Open risk`, value: '$49.3K', detail: t`penalty-weighted` },
    { label: t`Due this week`, value: '28', detail: t`obligations` },
    { label: t`Needs evidence`, value: '14', detail: t`source gaps` },
  ]
}

function useSeverityLabels(): Record<'critical' | 'high' | 'medium' | 'neutral', string> {
  const { t } = useLingui()
  return {
    critical: t`critical`,
    high: t`high`,
    medium: t`medium`,
    neutral: t`neutral`,
  }
}

const severityBadgeClass = {
  critical: 'border-severity-critical-border bg-severity-critical-tint text-severity-critical',
  high: 'border-severity-high-border bg-severity-high-tint text-severity-high',
  medium: 'border-severity-medium-border bg-severity-medium-tint text-severity-medium',
  neutral: 'border-border-default bg-severity-neutral-tint text-severity-neutral',
}

// Placeholder until the real pulse verification timestamp lands. Keeping it
// as a constant here means `<Trans>verified {verifiedAt}</Trans>` extracts a
// stable msgid instead of baking the time into the catalog.
const verifiedAt = '09:42'

export function DashboardRoute() {
  const { t } = useLingui()
  const pulseItems = usePulseItems()
  const queueStats = useQueueStats()
  const severityLabels = useSeverityLabels()
  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>
              <Trans>Risk pulse</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Dollar-first triage for the next operating window.</Trans>
            </CardDescription>
            <CardAction>
              <Badge variant="outline" className="font-mono tabular-nums">
                <Trans>verified {verifiedAt}</Trans>
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  <Trans>Penalty exposure</Trans>
                </span>
                <span className="font-mono text-hero leading-none font-bold tabular-nums">
                  $49.3K
                </span>
                <span className="text-sm text-text-secondary">
                  <Trans>Across 28 open obligations.</Trans>
                </span>
              </div>
              <div className="grid gap-3">
                {pulseItems.map((item) => (
                  <div
                    key={item.title}
                    className="grid gap-1 rounded-md border border-border-default bg-bg-panel p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="secondary" className="font-mono tabular-nums">
                        {item.source}
                      </Badge>
                    </div>
                    <span className="text-sm text-text-secondary">{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2 border-t border-border-default">
            <Button size="sm">
              <Trans>Review risk queue</Trans>
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="sm">
              <FileSearchIcon data-icon="inline-start" />
              <Trans>Evidence mode</Trans>
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>
              <Trans>Today queue</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Operational pressure points for the team.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {queueStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{stat.label}</span>
                  <span className="text-xs text-muted-foreground">{stat.detail}</span>
                </div>
                <span className="font-mono text-xl font-semibold tabular-nums">{stat.value}</span>
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
                  AI-facing recommendations remain hidden unless source, quote, and verification
                  time are present.
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
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle>
                  <Trans>Client risk rows</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Eight rows are visible on first load for dense scanning.</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t`Client`}</TableHead>
                      <TableHead>{t`Obligation`}</TableHead>
                      <TableHead>{t`Deadline`}</TableHead>
                      <TableHead>{t`Exposure`}</TableHead>
                      <TableHead>{t`Severity`}</TableHead>
                      <TableHead>{t`Owner`}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskRows.map((row) => (
                      <TableRow key={`${row.client}-${row.obligation}`}>
                        <TableCell className="font-medium">{row.client}</TableCell>
                        <TableCell className="text-text-secondary">{row.obligation}</TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {formatDate(row.deadline)}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {formatCents(row.exposure)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={severityBadgeClass[row.severity]}>
                            {severityLabels[row.severity]}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="evidence">
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle>
                  <Trans>Evidence checks</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Representative source states wired with existing components.</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Alert>
                  <CheckCircle2Icon />
                  <AlertTitle>
                    <Trans>Verified</Trans>
                  </AlertTitle>
                  <AlertDescription>
                    <Trans>IRS transcript source was checked this morning.</Trans>
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircleIcon />
                  <AlertTitle>
                    <Trans>Needs quote</Trans>
                  </AlertTitle>
                  <AlertDescription>
                    <Trans>Two recommendations are waiting on verbatim text.</Trans>
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>
                    <Trans>Blocked</Trans>
                  </AlertTitle>
                  <AlertDescription>
                    <Trans>One row lacks a usable source URL.</Trans>
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
