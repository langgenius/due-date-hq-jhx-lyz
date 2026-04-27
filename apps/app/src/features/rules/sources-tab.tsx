import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'

import type { RuleJurisdiction, RuleSource } from '@duedatehq/contracts'
import {
  Select,
  SelectContent,
  SelectGroup,
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

import { orpc } from '@/lib/rpc'

import {
  compactAcquisitionMethod,
  compactSourceType,
  countSourcesByHealth,
  filterSources,
  RULE_JURISDICTIONS,
  type SourceHealthFilter,
} from './rules-console-model'
import {
  FilterChips,
  HealthBadge,
  JurisdictionCode,
  QueryPanelState,
  SectionFrame,
  TableFooterBar,
} from './rules-console-primitives'

type JurisdictionFilter = 'ALL' | RuleJurisdiction

const DEFAULT_VISIBLE_SOURCE_ROWS = 12
const EMPTY_SOURCE_ROWS: RuleSource[] = []

export function SourcesTab() {
  const { t } = useLingui()
  const [healthFilter, setHealthFilter] = useState<SourceHealthFilter>('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState<JurisdictionFilter>('ALL')
  const [showAll, setShowAll] = useState(false)

  const queryInput = jurisdictionFilter === 'ALL' ? undefined : { jurisdiction: jurisdictionFilter }
  const sourcesQuery = useQuery(orpc.rules.listSources.queryOptions({ input: queryInput }))

  const rows = useMemo(() => sourcesQuery.data ?? EMPTY_SOURCE_ROWS, [sourcesQuery.data])
  const counts = useMemo(() => countSourcesByHealth(rows), [rows])
  const filteredRows = useMemo(() => filterSources(rows, healthFilter), [healthFilter, rows])
  const visibleRows = showAll ? filteredRows : filteredRows.slice(0, DEFAULT_VISIBLE_SOURCE_ROWS)

  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: t`All`, count: counts.all },
      { value: 'healthy' as const, label: t`Healthy`, count: counts.healthy },
      { value: 'degraded' as const, label: t`Degraded`, count: counts.degraded },
      { value: 'failing' as const, label: t`Failing`, count: counts.failing },
      { value: 'paused' as const, label: t`Paused`, count: counts.paused },
    ],
    [counts, t],
  )

  if (sourcesQuery.isLoading) {
    return <QueryPanelState state="loading" message={t`Loading rule sources.`} />
  }

  if (sourcesQuery.isError) {
    return <QueryPanelState state="error" message={t`Could not load rule sources.`} />
  }

  const footerNote = t`Showing ${visibleRows.length} of ${filteredRows.length} · click any row to open source detail drawer`
  const showAllAction = t`Show all ${filteredRows.length} →`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <FilterChips
          options={filterOptions}
          value={healthFilter}
          onValueChange={(value) => {
            setHealthFilter(value)
            setShowAll(false)
          }}
        />
        <JurisdictionFilterSelect
          value={jurisdictionFilter}
          onValueChange={setJurisdictionFilter}
        />
      </div>
      <SectionFrame>
        <Table>
          <TableHeader className="bg-background-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead>SOURCE</TableHead>
              <TableHead className="w-[52px]">JUR</TableHead>
              <TableHead className="w-[84px]">TYPE</TableHead>
              <TableHead className="w-[92px]">CADENCE</TableHead>
              <TableHead className="w-[80px]">METHOD</TableHead>
              <TableHead className="w-[98px]">HEALTH</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((source) => (
              <TableRow key={source.id} className="h-10 hover:bg-transparent">
                <TableCell className="max-w-[440px] py-1.5">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {source.title}
                    </span>
                    <span className="truncate font-mono text-xs text-text-tertiary">
                      {source.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <JurisdictionCode code={source.jurisdiction} />
                </TableCell>
                <TableCell className="py-1.5 text-sm text-text-secondary">
                  {compactSourceType(source.sourceType)}
                </TableCell>
                <TableCell className="py-1.5 text-sm text-text-secondary">
                  {source.cadence.replace('_', '-')}
                </TableCell>
                <TableCell className="py-1.5 text-sm text-text-secondary">
                  {compactAcquisitionMethod(source.acquisitionMethod)}
                </TableCell>
                <TableCell className="py-1.5">
                  <HealthBadge health={source.healthStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredRows.length > visibleRows.length ? (
          <TableFooterBar
            note={footerNote}
            action={showAllAction}
            onAction={() => setShowAll(true)}
          />
        ) : (
          <TableFooterBar note={footerNote} />
        )}
      </SectionFrame>
    </div>
  )
}

function JurisdictionFilterSelect({
  value,
  onValueChange,
}: {
  value: JurisdictionFilter
  onValueChange: (value: JurisdictionFilter) => void
}) {
  const { t } = useLingui()
  const labels = useMemo<Record<JurisdictionFilter, string>>(
    () => ({
      ALL: t`All`,
      FED: t`Federal`,
      CA: t`California`,
      NY: t`New York`,
      TX: t`Texas`,
      FL: t`Florida`,
      WA: t`Washington`,
    }),
    [t],
  )
  return (
    <div className="flex shrink-0 items-center gap-2 text-sm text-text-tertiary">
      <span>
        <Trans>Jurisdiction:</Trans>
      </span>
      <Select
        value={value}
        onValueChange={(next) => {
          if (isJurisdictionFilter(next)) {
            onValueChange(next)
          }
        }}
      >
        <SelectTrigger size="sm" className="h-7 min-w-24 bg-transparent px-2 text-sm shadow-none">
          <SelectValue>{labels[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectItem value="ALL">{labels.ALL}</SelectItem>
            {RULE_JURISDICTIONS.map((jurisdiction) => (
              <SelectItem key={jurisdiction} value={jurisdiction}>
                {labels[jurisdiction]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function isJurisdictionFilter(value: string | null): value is JurisdictionFilter {
  if (value === 'ALL') return true
  if (typeof value !== 'string') return false
  return (RULE_JURISDICTIONS as readonly string[]).includes(value)
}
