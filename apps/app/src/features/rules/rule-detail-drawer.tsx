import { useId, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { CheckIcon, MinusIcon, PlusIcon, TriangleAlertIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

import type {
  DueDateLogic,
  ObligationRule,
  RuleEvidence,
  RuleEvidenceAuthorityRole,
  RuleSource,
} from '@duedatehq/contracts'
import {
  DueDateLogicSchema,
  ExtensionPolicySchema,
  RuleQualityChecklistSchema,
  RuleTierSchema,
} from '@duedatehq/contracts'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@duedatehq/ui/components/ui/sheet'
import { Textarea } from '@duedatehq/ui/components/ui/textarea'
import { cn } from '@duedatehq/ui/lib/utils'

import { IsoDatePicker, isValidIsoDate } from '@/components/primitives/iso-date-picker'
import { ConceptLabel } from '@/features/concepts/concept-help'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

import {
  formatEnumLabel,
  humanizeDueDateLogic,
  RULE_AUTHORITY_ROLE_LABEL,
} from './rules-console-model'
import { JurisdictionCode, ToneDot } from './rules-console-primitives'
import { useSourceLookup } from './use-source-lookup'

/**
 * Right-side drawer that surfaces the full audit footprint behind a single
 * `ObligationRule` row. Pure presentation: parents pass the already-fetched
 * rule from the `rules.listRules` cache; the drawer never re-issues a query
 * for the rule itself, only for the shared source registry through
 * `useSourceLookup`.
 *
 * Section order is fixed: Applicability → Due-date logic → Extension →
 * Review reasons (conditional) → Evidence → Verification footer. Quality
 * checklist + version compare are intentionally omitted for the read-only
 * MVP (P1 publish flow surface).
 */
export function RuleDetailDrawer({
  rule,
  open,
  onOpenChange,
}: {
  rule: ObligationRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full sm:data-[side=right]:w-[min(920px,calc(100vw-2rem))] sm:data-[side=right]:max-w-none flex flex-col gap-0 overflow-hidden p-0">
        {rule ? <RuleDetailContent rule={rule} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function RuleDetailContent({ rule }: { rule: ObligationRule }) {
  const sourceLookup = useSourceLookup()

  return (
    <>
      <RuleDrawerHeader rule={rule} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-5">
          <ApplicabilitySection rule={rule} />
          <DueDateLogicSection rule={rule} />
          <ExtensionSection rule={rule} />
          <ReviewReasonsSection rule={rule} />
          <CandidateReviewSection key={rule.id} rule={rule} sourceLookup={sourceLookup} />
          <EvidenceSection rule={rule} sourceLookup={sourceLookup} />
          <VerificationSection rule={rule} />
        </div>
      </div>
    </>
  )
}

function CandidateReviewSection({
  rule,
  sourceLookup,
}: {
  rule: ObligationRule
  sourceLookup: ReadonlyMap<string, RuleSource>
}) {
  if (rule.status !== 'candidate') return null
  return <CandidateReviewForm rule={rule} sourceLookup={sourceLookup} />
}

type PublishMode = 'manual' | 'reminder_ready'
type ConcreteDueDateKind = 'fixed_date' | 'tax_year_end' | 'tax_year_begin'
type HolidayRollover = 'source_adjusted' | 'next_business_day'
type ReviewExtensionPolicy = ObligationRule['extensionPolicy']

const EXTENSION_METHOD_SUGGESTIONS = [
  'Form 7004',
  'Form IT-370-PF',
  'Form F-7004',
  'automatic extension',
  'portal request',
  'payment voucher',
  'source-defined process',
  'Texas franchise tax extension',
] as const

function initialPublishMode(rule: ObligationRule): PublishMode {
  return rule.coverageStatus === 'full' && rule.dueDateLogic.kind !== 'source_defined_calendar'
    ? 'reminder_ready'
    : 'manual'
}

function initialConcreteDueDateKind(rule: ObligationRule): ConcreteDueDateKind {
  if (rule.dueDateLogic.kind === 'fixed_date') return 'fixed_date'
  if (rule.dueDateLogic.kind === 'nth_day_after_tax_year_begin') return 'tax_year_begin'
  return 'tax_year_end'
}

function defaultFixedDate(rule: ObligationRule): string {
  return `${rule.applicableYear}-04-15`
}

function intInRange(value: string, min: number, max: number): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null
}

function positiveIntegerString(value: string): string {
  return value.replace(/\D/g, '')
}

function clampedIntegerString(value: string, min: number, max: number): string {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed)) return ''
  return String(Math.min(max, Math.max(min, parsed)))
}

function steppedIntegerString(value: string, min: number, max: number, delta: -1 | 1): string {
  const parsed = Number.parseInt(value, 10)
  const base = Number.isInteger(parsed) ? parsed : delta > 0 ? min - 1 : min + 1
  return String(Math.min(max, Math.max(min, base + delta)))
}

function sourceDefinedDescription(rule: ObligationRule, heading: string): string {
  if (rule.dueDateLogic.kind === 'source_defined_calendar') return rule.dueDateLogic.description
  return `${rule.title}: ${heading}`
}

function filterExtensionMethodSuggestions(value: string): readonly string[] {
  const query = value.trim().toLowerCase()
  if (!query) return []
  return EXTENSION_METHOD_SUGGESTIONS.filter((option) => option.toLowerCase().includes(query))
}

function CandidateReviewForm({
  rule,
  sourceLookup,
}: {
  rule: ObligationRule
  sourceLookup: ReadonlyMap<string, RuleSource>
}) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const primaryEvidence = rule.evidence[0]
  const [sourceId, setSourceId] = useState(primaryEvidence?.sourceId ?? rule.sourceIds[0] ?? '')
  const [sourceHeading, setSourceHeading] = useState(
    primaryEvidence?.locator.heading ?? t`Official due date page`,
  )
  const [sourceExcerpt, setSourceExcerpt] = useState(primaryEvidence?.sourceExcerpt ?? '')
  const [publishMode, setPublishMode] = useState<PublishMode>(() => initialPublishMode(rule))
  const [concreteDueDateKind, setConcreteDueDateKind] = useState<ConcreteDueDateKind>(() =>
    initialConcreteDueDateKind(rule),
  )
  const [fixedDate, setFixedDate] = useState(
    rule.dueDateLogic.kind === 'fixed_date' ? rule.dueDateLogic.date : defaultFixedDate(rule),
  )
  const [fixedHolidayRollover, setFixedHolidayRollover] =
    useState<HolidayRollover>('next_business_day')
  const [monthOffset, setMonthOffset] = useState(
    rule.dueDateLogic.kind === 'nth_day_after_tax_year_end' ||
      rule.dueDateLogic.kind === 'nth_day_after_tax_year_begin'
      ? String(rule.dueDateLogic.monthOffset)
      : '4',
  )
  const [dayOfMonth, setDayOfMonth] = useState(
    rule.dueDateLogic.kind === 'nth_day_after_tax_year_end' ||
      rule.dueDateLogic.kind === 'nth_day_after_tax_year_begin'
      ? String(rule.dueDateLogic.day)
      : '15',
  )
  const [extensionAvailable, setExtensionAvailable] = useState(rule.extensionPolicy.available)
  const [extensionFormName, setExtensionFormName] = useState(rule.extensionPolicy.formName ?? '')
  const [extensionDurationMonths, setExtensionDurationMonths] = useState(
    rule.extensionPolicy.durationMonths ? String(rule.extensionPolicy.durationMonths) : '',
  )
  const [extensionPaymentExtended, setExtensionPaymentExtended] = useState(
    rule.extensionPolicy.paymentExtended,
  )
  const [extensionNotes, setExtensionNotes] = useState(rule.extensionPolicy.notes)
  const [ruleTier, setRuleTier] = useState<ObligationRule['ruleTier']>('basic')
  const [requiresReview, setRequiresReview] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const coverageStatus: ObligationRule['coverageStatus'] =
    publishMode === 'manual' ? 'manual' : 'full'
  const effectiveRequiresReview = publishMode === 'manual' ? true : requiresReview
  const fixedDateInvalid = fixedDate.trim() !== '' && !isValidIsoDate(fixedDate.trim())

  const invalidateRules = () => {
    void queryClient.invalidateQueries({ queryKey: orpc.rules.key() })
    void queryClient.invalidateQueries({ queryKey: orpc.audit.key() })
  }

  const verifyMutation = useMutation(
    orpc.rules.verifyCandidate.mutationOptions({
      onSuccess: () => {
        invalidateRules()
        toast.success(t`Candidate verified`)
      },
      onError: (error) => {
        toast.error(t`Couldn't verify candidate`, {
          description: rpcErrorMessage(error) ?? t`Please check the review fields.`,
        })
      },
    }),
  )
  const rejectMutation = useMutation(
    orpc.rules.rejectCandidate.mutationOptions({
      onSuccess: () => {
        invalidateRules()
        toast.success(t`Candidate rejected`)
      },
      onError: (error) => {
        toast.error(t`Couldn't reject candidate`, {
          description: rpcErrorMessage(error) ?? t`Please add a review note.`,
        })
      },
    }),
  )

  const sourceOptions = rule.sourceIds
    .map((id) => sourceLookup.get(id))
    .filter((source): source is RuleSource => source !== undefined)

  const buildDueDateLogic = (): DueDateLogic | null => {
    if (publishMode === 'manual') {
      return {
        kind: 'source_defined_calendar',
        description: sourceDefinedDescription(rule, sourceHeading.trim() || t`Official calendar`),
        holidayRollover: 'source_adjusted',
      }
    }

    if (concreteDueDateKind === 'fixed_date') {
      return {
        kind: 'fixed_date',
        date: fixedDate.trim(),
        holidayRollover: fixedHolidayRollover,
      }
    }

    const parsedMonthOffset = intInRange(monthOffset, 1, 12)
    const parsedDay = intInRange(dayOfMonth, 1, 31)
    if (!parsedMonthOffset || !parsedDay) return null

    return {
      kind:
        concreteDueDateKind === 'tax_year_begin'
          ? 'nth_day_after_tax_year_begin'
          : 'nth_day_after_tax_year_end',
      monthOffset: parsedMonthOffset,
      day: parsedDay,
      holidayRollover: 'next_business_day',
    }
  }

  const buildExtensionPolicy = (): ReviewExtensionPolicy | null => {
    const notes = extensionNotes.trim()
    if (!notes) return null
    if (!extensionAvailable) {
      return {
        available: false,
        paymentExtended: false,
        notes,
      }
    }

    const durationMonths =
      extensionDurationMonths.trim().length > 0 ? intInRange(extensionDurationMonths, 1, 24) : null
    if (extensionDurationMonths.trim().length > 0 && durationMonths === null) return null

    return {
      available: true,
      ...(extensionFormName.trim() ? { formName: extensionFormName.trim() } : {}),
      ...(durationMonths !== null ? { durationMonths } : {}),
      paymentExtended: extensionPaymentExtended,
      notes,
    }
  }

  const submitVerify = () => {
    setFormError(null)
    if (!sourceId) {
      setFormError(t`Choose an official source.`)
      return
    }
    if (!sourceHeading.trim() || !sourceExcerpt.trim()) {
      setFormError(t`Source heading and excerpt are required.`)
      return
    }
    const dueDateLogic = DueDateLogicSchema.safeParse(buildDueDateLogic())
    const extensionPolicy = ExtensionPolicySchema.safeParse(buildExtensionPolicy())
    const parsedRuleTier = RuleTierSchema.safeParse(ruleTier)
    const quality = RuleQualityChecklistSchema.parse({
      filingPaymentDistinguished: true,
      extensionHandled: true,
      calendarFiscalSpecified: true,
      holidayRolloverHandled: true,
      crossVerified: true,
      exceptionChannel: true,
    })
    if (!dueDateLogic.success) {
      setFormError(t`Due date logic is invalid.`)
      return
    }
    if (!extensionPolicy.success) {
      setFormError(t`Extension policy is invalid.`)
      return
    }
    if (!parsedRuleTier.success) {
      setFormError(t`Review status is invalid.`)
      return
    }

    verifyMutation.mutate({
      ruleId: rule.id,
      sourceId,
      sourceHeading: sourceHeading.trim(),
      sourceExcerpt: sourceExcerpt.trim(),
      dueDateLogic: dueDateLogic.data,
      extensionPolicy: extensionPolicy.data,
      ruleTier: parsedRuleTier.data,
      coverageStatus,
      requiresApplicabilityReview: effectiveRequiresReview,
      quality,
      nextReviewOn: `${new Date().getFullYear()}-11-15`,
      ...(reviewNote.trim() ? { reviewNote: reviewNote.trim() } : {}),
    })
  }

  const submitReject = () => {
    const reason = reviewNote.trim()
    rejectMutation.mutate({
      ruleId: rule.id,
      reason: reason || t`Rejected during rules review.`,
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-md border border-state-accent-active-alt bg-background-default px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>
          <Trans>Firm review</Trans>
        </SectionLabel>
        <span className="text-xs text-status-review">
          <Trans>Candidate</Trans>
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-text-tertiary">
          <span>
            <Trans>Official source</Trans>
          </span>
          <select
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
            className="h-8 rounded-md border border-divider-regular bg-background-default px-2 text-sm text-text-primary"
          >
            {sourceOptions.length === 0 && sourceId ? (
              <option value={sourceId}>{sourceId}</option>
            ) : null}
            {sourceOptions.map((source) => (
              <option key={source.id} value={source.id}>
                {source.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-tertiary">
          <span>
            <Trans>Source heading</Trans>
          </span>
          <input
            value={sourceHeading}
            onChange={(event) => setSourceHeading(event.target.value)}
            className="h-8 rounded-md border border-divider-regular bg-background-default px-2 text-sm text-text-primary"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-text-tertiary">
        <span>
          <Trans>Official excerpt</Trans>
        </span>
        <Textarea
          value={sourceExcerpt}
          onChange={(event) => setSourceExcerpt(event.target.value)}
          className="min-h-20 text-xs"
        />
      </label>
      <div className="grid gap-2">
        <span className="text-xs font-medium uppercase text-text-tertiary">
          <Trans>Publish mode</Trans>
        </span>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex cursor-pointer gap-2 rounded-md border border-divider-regular p-3 text-sm">
            <input
              type="radio"
              checked={publishMode === 'manual'}
              onChange={() => setPublishMode('manual')}
              className="mt-0.5 size-4"
            />
            <span className="grid gap-1">
              <span className="font-medium text-text-primary">
                <Trans>Manual review</Trans>
              </span>
              <span className="text-xs text-text-tertiary">
                <Trans>Publish evidence, but generated deadlines still require CPA review.</Trans>
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-2 rounded-md border border-divider-regular p-3 text-sm">
            <input
              type="radio"
              checked={publishMode === 'reminder_ready'}
              onChange={() => setPublishMode('reminder_ready')}
              className="mt-0.5 size-4"
            />
            <span className="grid gap-1">
              <span className="font-medium text-text-primary">
                <Trans>Reminder-ready</Trans>
              </span>
              <span className="text-xs text-text-tertiary">
                <Trans>
                  Use a concrete due date calculation and allow reminder-ready previews.
                </Trans>
              </span>
            </span>
          </label>
        </div>
      </div>
      {publishMode === 'reminder_ready' ? (
        <div className="grid gap-3 rounded-md border border-divider-subtle bg-background-subtle p-3">
          <label className="flex flex-col gap-1 text-xs text-text-tertiary">
            <span>
              <Trans>Due date basis</Trans>
            </span>
            <select
              value={concreteDueDateKind}
              onChange={(event) => {
                const next = event.target.value
                if (next === 'fixed_date' || next === 'tax_year_end' || next === 'tax_year_begin') {
                  setConcreteDueDateKind(next)
                }
              }}
              className="h-8 rounded-md border border-divider-regular bg-background-default px-2 text-sm text-text-primary"
            >
              <option value="fixed_date">specific date</option>
              <option value="tax_year_end">after tax year end</option>
              <option value="tax_year_begin">after tax year begin</option>
            </select>
          </label>
          {concreteDueDateKind === 'fixed_date' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1 text-xs text-text-tertiary">
                <span>
                  <Trans>Due date</Trans>
                </span>
                <IsoDatePicker
                  value={fixedDate}
                  invalid={fixedDateInvalid}
                  ariaLabel={t`Due date`}
                  onValueChange={setFixedDate}
                />
              </div>
              <label className="flex flex-col gap-1 text-xs text-text-tertiary">
                <span>
                  <Trans>Weekend or holiday handling</Trans>
                </span>
                <select
                  value={fixedHolidayRollover}
                  onChange={(event) => {
                    const next = event.target.value
                    if (next === 'source_adjusted' || next === 'next_business_day') {
                      setFixedHolidayRollover(next)
                    }
                  }}
                  className="h-8 rounded-md border border-divider-regular bg-background-default px-2 text-sm text-text-primary"
                >
                  <option value="next_business_day">next business day</option>
                  <option value="source_adjusted">already adjusted by source</option>
                </select>
              </label>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-text-tertiary">
                <span>
                  <Trans>Month offset</Trans>
                </span>
                <input
                  inputMode="numeric"
                  value={monthOffset}
                  onChange={(event) => setMonthOffset(event.target.value)}
                  className="h-8 rounded-md border border-divider-regular bg-background-default px-2 text-sm text-text-primary"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-text-tertiary">
                <span>
                  <Trans>Day of month</Trans>
                </span>
                <input
                  inputMode="numeric"
                  value={dayOfMonth}
                  onChange={(event) => setDayOfMonth(event.target.value)}
                  className="h-8 rounded-md border border-divider-regular bg-background-default px-2 text-sm text-text-primary"
                />
              </label>
            </div>
          )}
        </div>
      ) : null}
      <div className="grid gap-3 rounded-md border border-divider-subtle bg-background-subtle p-3">
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={extensionAvailable}
                onChange={(event) => setExtensionAvailable(event.target.checked)}
                className="size-4"
              />
              <span>
                <Trans>This rule allows an extension</Trans>
              </span>
            </label>
            <p className="pl-6 text-xs text-text-tertiary">
              <Trans>
                Used to show extension guidance on obligations matched to this rule. It does not
                change client records, file an extension, or update due dates automatically.
              </Trans>
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1 text-xs text-text-tertiary">
              <span>
                <Trans>Official extension form or method</Trans>
              </span>
              <ExtensionMethodCombobox
                value={extensionFormName}
                onValueChange={setExtensionFormName}
                disabled={!extensionAvailable}
                ariaLabel={t`Official extension form or method`}
              />
            </div>
            <div className="flex flex-col gap-1 text-xs text-text-tertiary">
              <span>
                <Trans>Duration months</Trans>
              </span>
              <DurationMonthsStepper
                value={extensionDurationMonths}
                onChange={setExtensionDurationMonths}
                disabled={!extensionAvailable}
              />
            </div>
          </div>
        </div>
        <div className="grid gap-1">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={extensionPaymentExtended}
              onChange={(event) => setExtensionPaymentExtended(event.target.checked)}
              disabled={!extensionAvailable}
              className="size-4"
            />
            <span>
              <Trans>Does the extension also cover payment?</Trans>
            </span>
          </label>
          <p className="pl-6 text-xs text-text-tertiary">
            <Trans>
              If unchecked, treat this as filing-only; payment may still be due on the original
              date.
            </Trans>
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-text-tertiary">
          <span>
            <Trans>Extension note</Trans>
          </span>
          <Textarea
            value={extensionNotes}
            onChange={(event) => setExtensionNotes(event.target.value)}
            className="min-h-16 text-xs"
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-text-tertiary">
          <span>
            <Trans>Tier</Trans>
          </span>
          <select
            value={ruleTier}
            onChange={(event) => {
              const parsed = RuleTierSchema.safeParse(event.target.value)
              if (parsed.success) setRuleTier(parsed.data)
            }}
            className="h-8 rounded-md border border-divider-regular bg-background-default px-2 text-sm text-text-primary"
          >
            <option value="basic">basic</option>
            <option value="annual_rolling">annual_rolling</option>
            <option value="applicability_review">applicability_review</option>
            <option value="exception">exception</option>
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs text-text-tertiary">
          <span>
            <Trans>Coverage</Trans>
          </span>
          <span className="inline-flex h-8 items-center rounded-md border border-divider-regular bg-background-subtle px-2 text-sm text-text-primary">
            {coverageStatus}
          </span>
        </div>
        <label className="flex items-end gap-2 pb-1 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={effectiveRequiresReview}
            onChange={(event) => setRequiresReview(event.target.checked)}
            disabled={publishMode === 'manual'}
            className="size-4"
          />
          <span>
            <Trans>Requires applicability review</Trans>
          </span>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-text-tertiary">
        <span>
          <Trans>Review note</Trans>
        </span>
        <Textarea
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          className="min-h-16 text-xs"
        />
      </label>
      {formError ? <p className="text-xs font-medium text-severity-high">{formError}</p> : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={submitReject}
          disabled={rejectMutation.isPending || verifyMutation.isPending}
        >
          <Trans>Reject</Trans>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={submitVerify}
          disabled={verifyMutation.isPending || rejectMutation.isPending}
        >
          <Trans>Verify candidate</Trans>
        </Button>
      </div>
    </section>
  )
}

function ExtensionMethodCombobox({
  value,
  onValueChange,
  disabled,
  ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  ariaLabel: string
}) {
  const { t } = useLingui()
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(() => filterExtensionMethodSuggestions(value), [value])
  const hasValue = value.length > 0
  const showSuggestions = open && !disabled && suggestions.length > 0

  function changeOpen(nextOpen: boolean) {
    setOpen(disabled ? false : nextOpen)
  }

  function selectSuggestion(nextValue: string) {
    onValueChange(nextValue === value ? '' : nextValue)
    setOpen(false)
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          changeOpen(false)
        }
      }}
    >
      <input
        value={value}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showSuggestions}
        placeholder={t`Form 7004, automatic extension, portal request, or source-defined process`}
        disabled={disabled}
        onFocus={() => changeOpen(true)}
        onChange={(event) => {
          onValueChange(event.target.value)
          changeOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') changeOpen(false)
        }}
        className={cn(
          'h-8 w-full rounded-md border border-divider-regular bg-background-default px-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-placeholder focus-visible:border-components-input-border-active focus-visible:ring-2 focus-visible:ring-state-accent-active-alt disabled:text-text-tertiary',
          hasValue ? 'pr-8' : undefined,
        )}
      />
      {hasValue ? (
        <button
          type="button"
          aria-label={t`Clear`}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onValueChange('')
            changeOpen(false)
          }}
          className="absolute right-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:bg-background-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-accent-active-alt disabled:pointer-events-none disabled:opacity-50"
        >
          <XIcon className="size-3.5" aria-hidden />
        </button>
      ) : null}
      {showSuggestions ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-md border border-components-panel-border bg-components-panel-bg p-1 text-text-primary shadow-overlay">
          <div className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <Trans>Suggestions</Trans>
          </div>
          <div id={listboxId} role="listbox" className="max-h-56 overflow-y-auto">
            {suggestions.map((suggestion) => {
              const selected = suggestion === value
              return (
                <button
                  key={suggestion}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-background-subtle focus-visible:bg-background-subtle focus-visible:outline-none"
                >
                  <span className="truncate">{suggestion}</span>
                  <CheckIcon
                    className={cn(
                      'size-4 text-text-accent',
                      selected ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DurationMonthsStepper({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { t } = useLingui()
  const min = 1
  const max = 24
  const parsed = Number.parseInt(value, 10)
  const hasParsedValue = Number.isInteger(parsed)
  const canDecrease = !disabled && hasParsedValue && parsed > min
  const canIncrease = !disabled && (!hasParsedValue || parsed < max)

  return (
    <div
      className={cn(
        'flex h-8 w-full overflow-hidden rounded-md border border-divider-regular bg-background-default text-sm text-text-primary',
        disabled
          ? 'bg-components-input-bg-disabled text-components-input-text-filled-disabled'
          : '',
      )}
    >
      <button
        type="button"
        aria-label={t`Decrease duration months`}
        onClick={() => onChange(steppedIntegerString(value, min, max, -1))}
        disabled={!canDecrease}
        className="flex h-full w-8 shrink-0 items-center justify-center border-r border-divider-regular text-text-secondary transition-colors hover:bg-background-default-hover disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent"
      >
        <MinusIcon className="size-3.5" aria-hidden />
      </button>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(event) => onChange(positiveIntegerString(event.target.value))}
        onBlur={() => onChange(clampedIntegerString(value, min, max))}
        disabled={disabled}
        aria-label={t`Duration months`}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-center text-sm text-inherit outline-none disabled:cursor-not-allowed"
      />
      <button
        type="button"
        aria-label={t`Increase duration months`}
        onClick={() => onChange(steppedIntegerString(value, min, max, 1))}
        disabled={!canIncrease}
        className="flex h-full w-8 shrink-0 items-center justify-center border-l border-divider-regular text-text-secondary transition-colors hover:bg-background-default-hover disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent"
      >
        <PlusIcon className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

function RuleDrawerHeader({ rule }: { rule: ObligationRule }) {
  return (
    <SheetHeader className="gap-2 border-b border-divider-regular px-5 py-4">
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <span className="font-mono text-text-secondary">{rule.id}</span>
        <span aria-hidden>·</span>
        <span className="font-mono">v{rule.version}</span>
        <span aria-hidden>·</span>
        <RuleStatusInline status={rule.status} />
      </div>
      <SheetTitle className="text-md text-text-primary">{rule.title}</SheetTitle>
      <SheetDescription className="sr-only">
        <Trans>Rule detail and evidence</Trans>
      </SheetDescription>
    </SheetHeader>
  )
}

function RuleStatusInline({ status }: { status: ObligationRule['status'] }) {
  if (status === 'candidate') {
    return (
      <span className="inline-flex items-center gap-1.5 text-status-review">
        <ToneDot tone="review" />
        <ConceptLabel concept="candidateRule">
          <Trans>Candidate</Trans>
        </ConceptLabel>
      </span>
    )
  }
  if (status === 'deprecated') {
    return (
      <span className="inline-flex items-center gap-1.5 text-text-tertiary">
        <ToneDot tone="disabled" />
        <Trans>Deprecated</Trans>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-text-secondary">
      <ToneDot tone="success" />
      <ConceptLabel concept="verifiedRule">
        <Trans>Verified</Trans>
      </ConceptLabel>
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
      {children}
    </p>
  )
}

function ApplicabilitySection({ rule }: { rule: ObligationRule }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>
        <Trans>Applicability</Trans>
      </SectionLabel>
      <div className="flex flex-wrap items-center gap-2 text-base">
        <JurisdictionCode code={rule.jurisdiction} />
        <span className="text-text-secondary">{rule.entityApplicability.join(', ')}</span>
      </div>
      <div className="grid grid-cols-[88px_1fr] gap-y-1.5 text-base">
        <span className="text-text-tertiary">
          <Trans>Tax type</Trans>
        </span>
        <span className="font-mono text-sm text-text-secondary">{rule.taxType}</span>
        <span className="text-text-tertiary">
          <Trans>Form</Trans>
        </span>
        <span className="text-text-secondary">{rule.formName}</span>
        <span className="text-text-tertiary">
          <Trans>Event</Trans>
        </span>
        <EventRow rule={rule} />
        <span className="text-text-tertiary">
          <Trans>Tax year</Trans>
        </span>
        <span className="font-mono text-sm text-text-secondary">
          {rule.taxYear} → {rule.applicableYear}
        </span>
      </div>
    </section>
  )
}

function EventRow({ rule }: { rule: ObligationRule }) {
  // Surface the eventType as the canonical label and only append "+ filing /
  // + payment" when it adds non-redundant information. eventType is already
  // one of filing/payment/extension/election/information_report; rendering
  // `filing · filing` (the previous version) was a faithful but ugly mirror
  // of the contract's two flag fields.
  const extras: ('filing' | 'payment')[] = []
  if (rule.isFiling && rule.eventType !== 'filing') extras.push('filing')
  if (rule.isPayment && rule.eventType !== 'payment') extras.push('payment')
  return (
    <span className="text-text-secondary">
      {formatEnumLabel(rule.eventType)}
      {extras.length > 0 ? (
        <span className="ml-2 text-text-tertiary">· also {extras.join(' + ')}</span>
      ) : null}
    </span>
  )
}

function DueDateLogicSection({ rule }: { rule: ObligationRule }) {
  const summary = useMemo(() => humanizeDueDateLogic(rule.dueDateLogic), [rule.dueDateLogic])
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>
        <Trans>Due date logic</Trans>
      </SectionLabel>
      <p className="text-base text-text-primary">{summary}</p>
    </section>
  )
}

function ExtensionSection({ rule }: { rule: ObligationRule }) {
  const { extensionPolicy } = rule
  const durationMonths = extensionPolicy.durationMonths
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>
        <Trans>Extension</Trans>
      </SectionLabel>
      {extensionPolicy.available ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-base text-text-primary">
            <Trans>This rule allows an extension.</Trans>
          </p>
          <div className="flex flex-wrap items-center gap-2 text-base text-text-primary">
            {extensionPolicy.formName ? (
              <span className="font-medium">{extensionPolicy.formName}</span>
            ) : null}
            {durationMonths !== undefined ? (
              <span className="text-text-secondary">
                <Trans>{durationMonths} months</Trans>
              </span>
            ) : null}
          </div>
          <div className="text-sm">
            {extensionPolicy.paymentExtended ? (
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <Trans>Extension also covers payment.</Trans>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-severity-medium">
                <TriangleAlertIcon className="size-3.5 shrink-0" aria-hidden />
                <Trans>Filing-only extension; payment is not extended.</Trans>
              </span>
            )}
          </div>
          <p className="text-xs text-text-tertiary">{extensionPolicy.notes}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 text-base">
          <span className="text-text-secondary">
            <Trans>This rule does not allow an extension.</Trans>
          </span>
          <p className="text-xs text-text-tertiary">{extensionPolicy.notes}</p>
        </div>
      )}
    </section>
  )
}

function ReviewReasonsSection({ rule }: { rule: ObligationRule }) {
  if (rule.status !== 'candidate' && !rule.requiresApplicabilityReview) return null

  if (rule.status === 'candidate') {
    return (
      <section className="rounded-md border border-state-accent-active-alt bg-accent-tint px-3 py-2 text-xs">
        <p className="font-medium text-status-review">
          <Trans>Candidate · never generates user reminders.</Trans>
        </p>
        <p className="mt-1 text-text-secondary">{rule.defaultTip}</p>
      </section>
    )
  }

  return (
    <section className="rounded-md border border-divider-regular bg-severity-medium-tint px-3 py-2 text-xs">
      <p className="font-medium text-severity-medium">
        <Trans>Applicability review · needs CPA confirmation at generation time.</Trans>
      </p>
      <p className="mt-1 text-text-secondary">{rule.defaultTip}</p>
    </section>
  )
}

function EvidenceSection({
  rule,
  sourceLookup,
}: {
  rule: ObligationRule
  sourceLookup: ReadonlyMap<string, RuleSource>
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <SectionLabel>
          <Trans>Evidence</Trans>
        </SectionLabel>
        <span className="font-mono text-xs tabular-nums text-text-tertiary">
          {rule.evidence.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {rule.evidence.map((evidence) => (
          <EvidenceCard
            key={evidenceKey(evidence)}
            evidence={evidence}
            source={sourceLookup.get(evidence.sourceId)}
          />
        ))}
      </div>
    </section>
  )
}

function EvidenceCard({
  evidence,
  source,
}: {
  evidence: RuleEvidence
  source: RuleSource | undefined
}) {
  // Block-level card: render directly as <a> when source.url exists, plain
  // <div> otherwise. Avoids inheriting `inline-flex items-center` from the
  // shared SourceExternalLink (which is intended for inline link usage and
  // would force every column child to horizontally center, plus break the
  // truncate chain when the source title is long).
  const sharedClassName =
    'flex flex-col items-stretch gap-1.5 rounded-md border border-divider-regular bg-background-default px-3 py-2.5 text-left no-underline outline-none'
  const interactiveClassName =
    'hover:border-state-accent-active-alt hover:bg-state-base-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt'

  const inner = (
    <>
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AuthorityRoleBadge role={evidence.authorityRole} />
          <span className="min-w-0 flex-1 truncate text-base font-medium text-text-primary">
            {source?.title ?? evidence.sourceId}
          </span>
        </div>
        {source?.url ? (
          <span className="shrink-0 text-sm text-text-accent" aria-hidden>
            ↗
          </span>
        ) : null}
      </div>
      <EvidenceLocator evidence={evidence} />
      <p className="line-clamp-2 text-xs text-text-secondary italic">“{evidence.sourceExcerpt}”</p>
      <EvidenceMeta evidence={evidence} />
    </>
  )

  if (source?.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open official source: ${source.title}`}
        onClick={(event) => event.stopPropagation()}
        className={cn(sharedClassName, interactiveClassName)}
      >
        {inner}
      </a>
    )
  }

  return <div className={sharedClassName}>{inner}</div>
}

function evidenceKey(evidence: RuleEvidence): string {
  // RuleEvidence has no natural primary key, but `sourceId + authorityRole +
  // locator.heading` is unique within an `ObligationRule.evidence[]` per the
  // current rule pack (verified by `packages/core/src/rules/index.test.ts`).
  return `${evidence.sourceId}::${evidence.authorityRole}::${evidence.locator.heading ?? ''}`
}

function AuthorityRoleBadge({ role }: { role: RuleEvidenceAuthorityRole }) {
  const className = {
    basis: 'bg-accent-tint text-text-accent',
    cross_check: 'bg-background-subtle text-text-secondary',
    watch: 'bg-severity-medium-tint text-severity-medium',
    early_warning: 'bg-severity-medium-tint text-severity-medium',
  }[role]
  return (
    <Badge
      className={cn(
        'h-[18px] shrink-0 rounded-sm border-transparent px-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.04em]',
        className,
      )}
    >
      {RULE_AUTHORITY_ROLE_LABEL[role]}
    </Badge>
  )
}

function EvidenceLocator({ evidence }: { evidence: RuleEvidence }) {
  const parts: string[] = []
  if (evidence.locator.heading) parts.push(evidence.locator.heading)
  if (evidence.locator.tableLabel) parts.push(`table: ${evidence.locator.tableLabel}`)
  if (evidence.locator.rowLabel) parts.push(`row: ${evidence.locator.rowLabel}`)
  if (evidence.locator.pdfPage !== undefined) parts.push(`p.${evidence.locator.pdfPage}`)
  if (parts.length === 0) return null
  return <p className="text-xs text-text-tertiary">{parts.join(' · ')}</p>
}

function EvidenceMeta({ evidence }: { evidence: RuleEvidence }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
      <span>retrieved {evidence.retrievedAt}</span>
      {evidence.sourceUpdatedOn ? (
        <>
          <span aria-hidden>·</span>
          <span>updated {evidence.sourceUpdatedOn}</span>
        </>
      ) : null}
    </div>
  )
}

function VerificationSection({ rule }: { rule: ObligationRule }) {
  return (
    <section className="flex flex-col gap-1.5 border-t border-divider-subtle pt-4">
      <SectionLabel>
        <Trans>Verification</Trans>
      </SectionLabel>
      <div className="grid grid-cols-[88px_1fr] gap-y-1 text-xs">
        <span className="text-text-tertiary">
          <Trans>Verified by</Trans>
        </span>
        <span className="font-mono text-text-secondary">{rule.verifiedBy}</span>
        <span className="text-text-tertiary">
          <Trans>Verified at</Trans>
        </span>
        <span className="font-mono text-text-secondary">{rule.verifiedAt}</span>
        <span className="text-text-tertiary">
          <Trans>Next review</Trans>
        </span>
        <span className="font-mono text-text-secondary">{rule.nextReviewOn}</span>
      </div>
    </section>
  )
}
