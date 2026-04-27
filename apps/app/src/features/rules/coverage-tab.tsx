import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'

import type { RuleJurisdiction } from '@duedatehq/contracts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { cn } from '@duedatehq/ui/lib/utils'

import { orpc } from '@/lib/rpc'

import { COVERAGE_MATRIX, ENTITY_COLUMNS, RULE_JURISDICTIONS } from './rules-console-model'
import {
  CoverageCell,
  CoverageLegend,
  JurisdictionCode,
  QueryPanelState,
  SectionFrame,
  SectionLabel,
  ToneDot,
} from './rules-console-primitives'

type StatusTone = 'candidate' | 'basicReview' | 'review'

function CoverageStatusPill({
  jurisdiction,
  label,
}: {
  jurisdiction: RuleJurisdiction
  label: string
}) {
  // FED's "candidate watch" pill uses the *review* purple `#7c3aed`
  // (Figma 218:28), not `text-text-accent` (#4338ca). The latter is reserved
  // for read-only badges and active filter chips.
  const tone: StatusTone =
    jurisdiction === 'FED'
      ? 'candidate'
      : jurisdiction === 'TX' || jurisdiction === 'FL' || jurisdiction === 'WA'
        ? 'review'
        : 'basicReview'
  const className =
    tone === 'review'
      ? 'inline-flex h-[22px] items-center gap-2 rounded bg-severity-medium-tint px-2 text-xs font-medium text-severity-medium'
      : tone === 'candidate'
        ? 'inline-flex h-[22px] items-center gap-2 rounded bg-accent-tint px-2 text-xs font-medium text-status-review'
        : 'inline-flex h-[22px] items-center gap-2 rounded bg-background-subtle px-2 text-xs font-medium text-text-secondary'
  return (
    <span className={className}>
      <ToneDot tone={tone === 'candidate' ? 'review' : tone === 'review' ? 'warning' : 'success'} />
      {label}
    </span>
  )
}

export function CoverageTab() {
  const { t } = useLingui()
  const coverageQuery = useQuery(orpc.rules.coverage.queryOptions({ input: undefined }))

  // i18n labels live next to the component (Lingui extracts the macros at
  // build-time). They are wrapped in `useMemo` so the localized record stays
  // referentially stable until the active locale changes.
  const jurisdictionLabels = useMemo<Record<RuleJurisdiction, string>>(
    () => ({
      FED: t`Federal`,
      CA: t`California`,
      NY: t`New York`,
      TX: t`Texas`,
      FL: t`Florida`,
      WA: t`Washington`,
    }),
    [t],
  )

  const coverageStatusLabels = useMemo<Record<RuleJurisdiction, string>>(
    () => ({
      FED: t`4 verified · 1 candidate watch`,
      CA: t`3 basic · 2 review`,
      NY: t`3 basic · 4 review`,
      TX: t`All review-flagged`,
      FL: t`Source-defined cal`,
      WA: t`Filing-frequency review`,
    }),
    [t],
  )

  if (coverageQuery.isLoading) {
    return <QueryPanelState state="loading" message={t`Loading rules coverage.`} />
  }

  if (coverageQuery.isError) {
    return <QueryPanelState state="error" message={t`Could not load rules coverage.`} />
  }

  const rows = coverageQuery.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <Table>
          <TableHeader className="bg-background-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[62px]">JUR</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead className="w-[104px]">VERIFIED</TableHead>
              <TableHead className="w-[104px]">CANDIDATE</TableHead>
              <TableHead className="w-[100px]">SOURCES</TableHead>
              <TableHead className="w-[340px]">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.jurisdiction} className="h-11 hover:bg-transparent">
                <TableCell className="py-2">
                  <JurisdictionCode code={row.jurisdiction} />
                </TableCell>
                <TableCell className="py-2 text-sm font-medium">
                  {jurisdictionLabels[row.jurisdiction]}
                </TableCell>
                <TableCell className="py-2 font-mono text-sm tabular-nums">
                  {row.verifiedRuleCount}
                </TableCell>
                <TableCell
                  className={cn(
                    'py-2 font-mono text-sm tabular-nums',
                    // Candidate count tones the column purple only when there
                    // is at least one candidate (Figma 218:24); zero values
                    // stay muted to avoid drawing the eye to "nothing here".
                    row.candidateCount > 0 ? 'text-status-review' : 'text-text-muted',
                  )}
                >
                  {row.candidateCount}
                </TableCell>
                <TableCell className="py-2 font-mono text-sm tabular-nums text-text-secondary">
                  {row.sourceCount}
                </TableCell>
                <TableCell className="py-2">
                  <CoverageStatusPill
                    jurisdiction={row.jurisdiction}
                    label={coverageStatusLabels[row.jurisdiction]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionFrame>

      <div className="flex flex-col gap-2">
        <SectionLabel>
          <Trans>JURISDICTION × ENTITY · what is verifiable per (jurisdiction, entity) pair</Trans>
        </SectionLabel>
        <SectionFrame>
          <Table>
            <TableHeader className="bg-background-subtle">
              <TableRow className="hover:bg-transparent">
                <TableHead>JURISDICTION</TableHead>
                {ENTITY_COLUMNS.map((entity) => (
                  <TableHead key={entity}>{entity.replaceAll('_', '-').toUpperCase()}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {RULE_JURISDICTIONS.map((jurisdiction) => (
                <TableRow key={jurisdiction} className="h-9 hover:bg-transparent">
                  <TableCell className="py-2 text-sm font-medium">
                    {jurisdictionLabels[jurisdiction]}
                  </TableCell>
                  {ENTITY_COLUMNS.map((entity) => (
                    <TableCell key={entity} className="py-2">
                      <CoverageCell state={COVERAGE_MATRIX[jurisdiction][entity]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionFrame>
        <CoverageLegend />
      </div>
    </div>
  )
}
