import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  FileSearchIcon,
  ShieldCheckIcon,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCents, formatDate } from '@/lib/utils'

const pulseItems = [
  {
    title: 'IRS transcript mismatch',
    detail: '3 clients have estimated-tax deltas above the evidence threshold.',
    source: 'IRS-2026-Q1',
  },
  {
    title: 'NY PTET election window',
    detail: '2 partner entities need review before the March 15 cutoff.',
    source: 'NY-PTET-2026',
  },
  {
    title: 'Extension package hold',
    detail: '5 draft extensions are waiting on K-1 attachments.',
    source: 'Firm-Outbox',
  },
]

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

const queueStats = [
  { label: 'Open risk', value: '$49.3K', detail: 'penalty-weighted' },
  { label: 'Due this week', value: '28', detail: 'obligations' },
  { label: 'Needs evidence', value: '14', detail: 'source gaps' },
]

const severityBadgeClass = {
  critical: 'border-severity-critical-border bg-severity-critical-tint text-severity-critical',
  high: 'border-severity-high-border bg-severity-high-tint text-severity-high',
  medium: 'border-severity-medium-border bg-severity-medium-tint text-severity-medium',
  neutral: 'border-border-default bg-severity-neutral-tint text-severity-neutral',
}

export function DashboardRoute() {
  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>Risk pulse</CardTitle>
            <CardDescription>Dollar-first triage for the next operating window.</CardDescription>
            <CardAction>
              <Badge variant="outline" className="font-mono tabular-nums">
                verified 09:42
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Penalty exposure</span>
                <span className="font-mono text-hero leading-none font-bold tabular-nums">
                  $49.3K
                </span>
                <span className="text-sm text-text-secondary">Across 28 open obligations.</span>
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
              Review risk queue
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="sm">
              <FileSearchIcon data-icon="inline-start" />
              Evidence mode
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>Today queue</CardTitle>
            <CardDescription>Operational pressure points for the team.</CardDescription>
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
              <AlertTitle>Glass-box threshold is active</AlertTitle>
              <AlertDescription>
                AI-facing recommendations remain hidden unless source, quote, and verification time
                are present.
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
            <TabsTrigger value="risk">Risk table</TabsTrigger>
            <TabsTrigger value="evidence">Evidence checks</TabsTrigger>
          </TabsList>
          <TabsContent value="risk">
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle>Client risk rows</CardTitle>
                <CardDescription>
                  Eight rows are visible on first load for dense scanning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Obligation</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Exposure</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Owner</TableHead>
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
                            {row.severity}
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
                <CardTitle>Evidence checks</CardTitle>
                <CardDescription>
                  Representative source states wired with existing components.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Alert>
                  <CheckCircle2Icon />
                  <AlertTitle>Verified</AlertTitle>
                  <AlertDescription>
                    IRS transcript source was checked this morning.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircleIcon />
                  <AlertTitle>Needs quote</AlertTitle>
                  <AlertDescription>
                    Two recommendations are waiting on verbatim text.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Blocked</AlertTitle>
                  <AlertDescription>One row lacks a usable source URL.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
