import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'

import type { RuleCoverageRow, RuleJurisdiction } from '@duedatehq/contracts'
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

function StatCell({
  label,
  value,
  caption,
  emphasis,
}: {
  label: string
  value: number
  caption: string
  emphasis?: 'accent' | 'warning'
}) {
  const valueClass =
    emphasis === 'accent'
      ? 'text-status-review'
      : emphasis === 'warning'
        ? 'text-severity-medium'
        : 'text-text-primary'
  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <span className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
        {label}
      </span>
      <span
        className={cn('font-mono text-2xl leading-none font-semibold tabular-nums', valueClass)}
      >
        {value}
      </span>
      <span className="text-xs text-text-tertiary">{caption}</span>
    </div>
  )
}

function aggregateCoverage(rows: readonly RuleCoverageRow[]) {
  const verified = rows.reduce((sum, row) => sum + row.verifiedRuleCount, 0)
  const candidates = rows.reduce((sum, row) => sum + row.candidateCount, 0)
  const sources = rows.reduce((sum, row) => sum + row.sourceCount, 0)
  const fullyCovered = rows.filter((row) => row.candidateCount === 0).length
  return { verified, candidates, sources, fullyCovered, jurisdictions: rows.length }
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
  const stats = aggregateCoverage(rows)

  return (
    <div className="flex flex-col gap-6">
      {/*
        KPI strip — flat panel anchored to the same `left=24` as the tab nav.
        Four cells separated by 1 px hairlines (Level 1 surface, no shadow per
        DESIGN.md §6). Numbers are tabular-nums Geist Mono so the row reads as
        a financial scoreboard, not a marketing block.
      */}
      <SectionFrame>
        <div className="grid grid-cols-2 divide-y divide-divider-regular sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <StatCell
            label={t`Verified rules`}
            value={stats.verified}
            caption={t`reminder-ready across MVP scope`}
          />
          <StatCell
            label={t`Candidates`}
            value={stats.candidates}
            caption={t`pending ops review`}
            {...(stats.candidates > 0 ? { emphasis: 'accent' as const } : {})}
          />
          <StatCell
            label={t`Sources watched`}
            value={stats.sources}
            caption={t`official channels under monitor`}
          />
          <StatCell
            label={t`Jurisdictions`}
            value={stats.jurisdictions}
            caption={t`${stats.fullyCovered} fully covered · ${stats.jurisdictions - stats.fullyCovered} with open candidates`}
          />
        </div>
      </SectionFrame>

      {/*
        Two-column ops layout:
        - Left (col-span-7): per-jurisdiction summary — the substantive table
          where each row carries V/C/SRC counts plus the human-readable STATUS
          pill. This is the primary "what is the state per jurisdiction"
          answer the page exists to surface.
        - Right (col-span-5): jurisdiction × entity matrix — a denser
          "scanner" view that confirms which (jurisdiction, entity) pairs
          actually generate verifiable obligations vs. fall back to review.
        On viewports narrower than the `xl` breakpoint they stack with the
        summary on top — same reading order as the original 880 px column.
      */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col gap-2 xl:col-span-7">
          <div className="flex items-baseline justify-between">
            <SectionLabel>
              <Trans>JURISDICTION SUMMARY</Trans>
            </SectionLabel>
            <span className="text-xs text-text-tertiary">
              <Trans>verified · candidate · sources · current state</Trans>
            </span>
          </div>
          <SectionFrame>
            <Table>
              <TableHeader className="bg-background-subtle">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[64px]">JUR</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead className="w-[88px] text-right">VERIFIED</TableHead>
                  <TableHead className="w-[96px] text-right">CANDIDATE</TableHead>
                  <TableHead className="w-[88px] text-right">SOURCES</TableHead>
                  <TableHead className="w-[260px]">STATUS</TableHead>
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
                    <TableCell className="py-2 text-right font-mono text-sm tabular-nums">
                      {row.verifiedRuleCount}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'py-2 text-right font-mono text-sm tabular-nums',
                        // Candidate count tones the column purple only when there
                        // is at least one candidate (Figma 218:24); zero values
                        // stay muted to avoid drawing the eye to "nothing here".
                        row.candidateCount > 0 ? 'text-status-review' : 'text-text-muted',
                      )}
                    >
                      {row.candidateCount}
                    </TableCell>
                    <TableCell className="py-2 text-right font-mono text-sm tabular-nums text-text-secondary">
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
        </section>

        <section className="flex flex-col gap-2 xl:col-span-5">
          <div className="flex items-baseline justify-between">
            <SectionLabel>
              <Trans>JURISDICTION × ENTITY</Trans>
            </SectionLabel>
            <span className="text-xs text-text-tertiary">
              <Trans>verifiable per (jurisdiction, entity) pair</Trans>
            </span>
          </div>
          <SectionFrame>
            <Table>
              <TableHeader className="bg-background-subtle">
                <TableRow className="hover:bg-transparent">
                  <TableHead>JURISDICTION</TableHead>
                  {ENTITY_COLUMNS.map((entity) => (
                    <TableHead key={entity} className="text-center">
                      {entity.replaceAll('_', '-').toUpperCase()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {RULE_JURISDICTIONS.map((jurisdiction) => (
                  <TableRow key={jurisdiction} className="h-11 hover:bg-transparent">
                    <TableCell className="py-2 text-sm font-medium">
                      {jurisdictionLabels[jurisdiction]}
                    </TableCell>
                    {ENTITY_COLUMNS.map((entity) => (
                      <TableCell key={entity} className="py-2 text-center">
                        <CoverageCell state={COVERAGE_MATRIX[jurisdiction][entity]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionFrame>
          <CoverageLegend />
        </section>
      </div>
    </div>
  )
}
