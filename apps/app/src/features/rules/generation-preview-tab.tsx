import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Trans, useLingui } from '@lingui/react/macro'
import { CornerDownLeftIcon } from 'lucide-react'

import type {
  ObligationGenerationPreview,
  RuleGenerationPreviewInput,
  RuleSource,
} from '@duedatehq/contracts'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Input } from '@duedatehq/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import { cn } from '@duedatehq/ui/lib/utils'

import { orpc } from '@/lib/rpc'

import {
  DEFAULT_PREVIEW_FORM_VALUES,
  DEFAULT_PREVIEW_INPUT,
  formatEnumLabel,
  groupPreviewRows,
  previewFormSchema,
  previewFormToInput,
  RULE_GENERATION_STATES,
  type PreviewFormValues,
} from './rules-console-model'
import { QueryPanelState, SectionFrame, ToneDot } from './rules-console-primitives'
import { SourceExternalLink } from './source-external-link'
import { useSourceLookup } from './use-source-lookup'

const ENTITY_OPTIONS = ['llc', 'partnership', 's_corp', 'c_corp'] as const

export function GenerationPreviewTab() {
  const { t } = useLingui()
  const [previewInput, setPreviewInput] =
    useState<RuleGenerationPreviewInput>(DEFAULT_PREVIEW_INPUT)

  const form = useForm<PreviewFormValues>({
    resolver: zodResolver(previewFormSchema),
    defaultValues: DEFAULT_PREVIEW_FORM_VALUES,
  })

  const previewQuery = useQuery(
    orpc.rules.previewObligations.queryOptions({
      input: previewInput,
    }),
  )

  const entityTypeValue = form.watch('entityType')
  const stateValue = form.watch('state')
  const taxYearStart = form.watch('taxYearStart')
  const taxYearEnd = form.watch('taxYearEnd')
  const taxTypesValue = form.watch('taxTypes')
  const taxTypeChips = useMemo(
    () =>
      taxTypesValue
        .split(/[,\s]+/)
        .map((taxType) => taxType.trim())
        .filter(Boolean),
    [taxTypesValue],
  )

  const taxYearDisplay = formatTaxYearDisplay(taxYearStart, taxYearEnd)
  const taxYearInvalid = Boolean(
    form.formState.errors.taxYearStart || form.formState.errors.taxYearEnd,
  )

  const groups = useMemo(() => groupPreviewRows(previewQuery.data ?? []), [previewQuery.data])

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame className="px-4 py-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => {
            setPreviewInput(previewFormToInput(values))
          })}
        >
          <div className="grid grid-cols-[220px_110px_110px_220px_120px] gap-3">
            <PreviewField label={t`CLIENT ID`} htmlFor="preview-client-id">
              <Input
                id="preview-client-id"
                className="h-8 rounded-md font-mono text-xs"
                aria-invalid={Boolean(form.formState.errors.clientId)}
                {...form.register('clientId')}
              />
            </PreviewField>
            <PreviewField label={t`ENTITY`}>
              <Select
                value={entityTypeValue}
                onValueChange={(value) => {
                  if (isEntityOption(value)) {
                    form.setValue('entityType', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                }}
              >
                <SelectTrigger className="h-8 w-full rounded-md text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ENTITY_OPTIONS.map((entity) => (
                      <SelectItem key={entity} value={entity}>
                        {formatEnumLabel(entity).toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </PreviewField>
            <PreviewField label={t`STATE`}>
              <Select
                value={stateValue}
                onValueChange={(value) => {
                  if (isGenerationState(value)) {
                    form.setValue('state', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                }}
              >
                <SelectTrigger className="h-8 w-full rounded-md text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {RULE_GENERATION_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </PreviewField>
            <PreviewField label={t`TAX YEAR`} htmlFor="preview-tax-year">
              <Input
                id="preview-tax-year"
                className="h-8 rounded-md font-mono text-xs"
                aria-invalid={taxYearInvalid}
                value={taxYearDisplay}
                onChange={(event) => {
                  const parsed = parseTaxYearInput(event.target.value)
                  if (parsed.start) {
                    form.setValue('taxYearStart', parsed.start, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  if (parsed.end) {
                    form.setValue('taxYearEnd', parsed.end, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                }}
              />
            </PreviewField>
            <Button
              type="submit"
              variant="accent"
              className="self-end"
              disabled={previewQuery.isFetching}
            >
              {previewQuery.isFetching ? <Trans>Running…</Trans> : <Trans>Run preview</Trans>}
              <CornerDownLeftIcon data-icon="inline-end" aria-hidden />
            </Button>
          </div>

          <PreviewField label={t`TAX TYPES`} htmlFor="preview-tax-types">
            <div className="flex min-h-[56px] flex-wrap gap-1.5 rounded-md border border-divider-regular bg-background-subtle p-2">
              {taxTypeChips.length === 0 ? (
                <span className="text-xs text-text-tertiary">
                  <Trans>No tax types selected.</Trans>
                </span>
              ) : (
                taxTypeChips.map((taxType) => (
                  <span
                    key={taxType}
                    className="inline-flex h-6 items-center rounded border border-divider-regular bg-background-default px-2 font-mono text-[11px] text-text-secondary"
                  >
                    {taxType}
                  </span>
                ))
              )}
              <Input id="preview-tax-types" className="sr-only" {...form.register('taxTypes')} />
            </div>
          </PreviewField>
        </form>
      </SectionFrame>

      {previewQuery.isLoading ? (
        <QueryPanelState state="loading" message={t`Loading generation preview.`} />
      ) : previewQuery.isError ? (
        <QueryPanelState state="error" message={t`Could not run generation preview.`} />
      ) : (
        <PreviewResultsCard
          reminderReady={groups.reminderReady}
          requiresReview={groups.requiresReview}
        />
      )}
    </div>
  )
}

function PreviewField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const TAX_YEAR_FULL_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function formatTaxYearDisplay(start: string, end: string): string {
  if (start && end && start.slice(0, 4) === end.slice(0, 4)) {
    return `${start} → ${end.slice(5)}`
  }
  return `${start} → ${end}`
}

function parseTaxYearInput(value: string): { start?: string; end?: string } {
  const [rawStart, rawEnd] = value.split(/→|->/).map((part) => part.trim())
  const result: { start?: string; end?: string } = {}
  if (rawStart && TAX_YEAR_FULL_PATTERN.test(rawStart)) result.start = rawStart
  if (rawEnd && TAX_YEAR_FULL_PATTERN.test(rawEnd)) {
    result.end = rawEnd
  } else if (rawEnd && /^\d{2}-\d{2}$/.test(rawEnd) && result.start) {
    // Accept the design-style abbreviated end like "12-31" by reusing the
    // start year — keeps the visible label honest while the underlying form
    // schema stays strictly ISO YYYY-MM-DD.
    result.end = `${result.start.slice(0, 4)}-${rawEnd}`
  }
  return result
}

function isEntityOption(value: string | null): value is PreviewFormValues['entityType'] {
  if (typeof value !== 'string') return false
  return (ENTITY_OPTIONS as readonly string[]).includes(value)
}

function isGenerationState(value: string | null): value is PreviewFormValues['state'] {
  if (typeof value !== 'string') return false
  return (RULE_GENERATION_STATES as readonly string[]).includes(value)
}

function PreviewResultsCard({
  reminderReady,
  requiresReview,
}: {
  reminderReady: ObligationGenerationPreview[]
  requiresReview: ObligationGenerationPreview[]
}) {
  const { t } = useLingui()
  const sourceLookup = useSourceLookup()
  return (
    <SectionFrame>
      <PreviewGroupHeader
        tone="success"
        label={t`REMINDER READY — ${reminderReady.length} obligation, will fire 30 / 7 / 1-day reminders`}
      />
      {reminderReady.map((row) => (
        <PreviewResultRow
          key={`${row.ruleId}-${row.ruleVersion}-${row.period}`}
          row={row}
          sourceLookup={sourceLookup}
        />
      ))}
      <PreviewGroupHeader
        tone="review"
        label={t`REQUIRES REVIEW — ${requiresReview.length} items for CPA confirmation, never auto-reminded`}
      />
      {requiresReview.map((row) => (
        <PreviewResultRow
          key={`${row.ruleId}-${row.ruleVersion}-${row.period}`}
          row={row}
          sourceLookup={sourceLookup}
        />
      ))}
    </SectionFrame>
  )
}

function PreviewGroupHeader({ tone, label }: { tone: 'success' | 'review'; label: string }) {
  return (
    <div className="flex h-8 items-center gap-2 border-b border-divider-regular bg-background-subtle px-4">
      <ToneDot tone={tone} />
      <span
        className={cn(
          'text-[11px] font-medium uppercase tracking-[0.08em]',
          tone === 'success' ? 'text-status-done' : 'text-status-review',
        )}
      >
        {label}
      </span>
    </div>
  )
}

function PreviewResultRow({
  row,
  sourceLookup,
}: {
  row: ObligationGenerationPreview
  sourceLookup: ReadonlyMap<string, RuleSource>
}) {
  const { t } = useLingui()
  const evidence = row.evidence[0]
  const evidenceSource = evidence ? sourceLookup.get(evidence.sourceId) : undefined
  const linkLabel = evidence?.summary ?? row.sourceIds[0] ?? t`Source`
  return (
    <div className="grid min-h-16 grid-cols-[128px_1fr_160px] gap-4 border-b border-divider-subtle px-4 py-3 last:border-b-0">
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            'font-mono text-base leading-none font-bold tabular-nums',
            row.reminderReady ? 'text-text-primary' : 'text-text-disabled',
          )}
        >
          {row.dueDate ?? t`source`}
        </span>
        <span
          className={cn(
            'text-[11px] font-medium',
            row.reminderReady ? 'text-text-tertiary' : 'text-severity-medium',
          )}
        >
          {row.reminderReady ? <Trans>reminder ready</Trans> : <Trans>no reminder</Trans>}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-[13px] font-medium text-text-primary">
          {row.ruleTitle} · {row.formName}
        </span>
        <span className="truncate font-mono text-[11px] text-text-tertiary">
          {row.ruleId} v{row.ruleVersion} · {row.matchedTaxType} → {row.taxType}
        </span>
        {row.reviewReasons.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.reviewReasons.map((reason) => (
              <span
                key={reason}
                className="inline-flex h-[18px] items-center rounded-sm bg-severity-medium-tint px-1.5 font-mono text-[10px] text-severity-medium"
              >
                {reason}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex items-start justify-end pt-1">
        <SourceExternalLink
          source={evidenceSource}
          ariaLabel={evidenceSource ? t`Open official source: ${evidenceSource.title}` : undefined}
          showIcon={false}
          className="max-w-full truncate text-right text-[11px] text-text-accent"
        >
          <span className="truncate">{linkLabel}</span>
          <span aria-hidden className="ml-1 shrink-0">
            ↗
          </span>
        </SourceExternalLink>
      </div>
    </div>
  )
}
