import { ORPCError } from '@orpc/server'
import {
  ObligationRuleSchema,
  type ObligationGenerationPreview,
  type RuleReviewDecision,
  type RuleSource,
  type TemporaryRule,
} from '@duedatehq/contracts'
import {
  getMvpRuleCoverage,
  findRuleById,
  listObligationRules,
  listRuleSources,
  previewObligationsFromRules,
  type ObligationRule as CoreObligationRule,
  type RuleJurisdiction,
  type RuleStatus,
} from '@duedatehq/core/rules'
import type { RuleReviewDecisionRow, TemporaryRuleRow } from '@duedatehq/ports/rules'
import { requireTenant, type RpcContext } from '../_context'
import { requireCurrentFirmRole } from '../_permissions'
import { os } from '../_root'
import { toContractRule, toCoreRule } from './runtime'

function toSource(source: ReturnType<typeof listRuleSources>[number]): RuleSource {
  return {
    ...source,
    notificationChannels: [...source.notificationChannels],
  }
}

function toPreview(
  preview: ReturnType<typeof previewObligationsFromRules>[number],
): ObligationGenerationPreview {
  return {
    ...preview,
    sourceIds: [...preview.sourceIds],
    evidence: preview.evidence.map((item) => ({ ...item })),
    reviewReasons: [...preview.reviewReasons],
  }
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toDateOnlyOrNull(date: Date | null): string | null {
  return date ? toDateOnly(date) : null
}

function parseDecisionRule(row: RuleReviewDecisionRow): CoreObligationRule | null {
  if (row.status !== 'verified' || !row.ruleJson) return null
  const parsed = ObligationRuleSchema.safeParse(row.ruleJson)
  return parsed.success ? toCoreRule(parsed.data) : null
}

function toReviewDecision(row: RuleReviewDecisionRow): RuleReviewDecision {
  const rule = parseDecisionRule(row)
  return {
    id: row.id,
    ruleId: row.ruleId,
    baseVersion: row.baseVersion,
    status: row.status,
    rule: rule ? toContractRule(rule) : null,
    reviewNote: row.reviewNote,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt.toISOString(),
  }
}

function toTemporaryRule(row: TemporaryRuleRow): TemporaryRule {
  return {
    id: row.id,
    alertId: row.alertId,
    sourcePulseId: row.sourcePulseId,
    title: row.title,
    sourceUrl: row.sourceUrl,
    sourceExcerpt: row.sourceExcerpt,
    jurisdiction: row.jurisdiction,
    counties: row.counties,
    affectedForms: row.affectedForms,
    affectedEntityTypes: row.affectedEntityTypes,
    overrideType: row.overrideType,
    overrideDueDate: toDateOnlyOrNull(row.overrideDueDate),
    effectiveFrom: toDateOnlyOrNull(row.effectiveFrom),
    effectiveUntil: toDateOnlyOrNull(row.effectiveUntil),
    status: row.status,
    appliedObligationCount: row.appliedObligationCount,
    activeObligationCount: row.activeObligationCount,
    revertedObligationCount: row.revertedObligationCount,
    firstAppliedAt: row.firstAppliedAt ? row.firstAppliedAt.toISOString() : null,
    lastActivityAt: row.lastActivityAt.toISOString(),
  }
}

function mergeRulesWithDecisions(
  baseRules: readonly CoreObligationRule[],
  decisions: readonly RuleReviewDecisionRow[],
): CoreObligationRule[] {
  const publishedById = new Map<string, CoreObligationRule>()
  for (const decision of decisions) {
    const rule = parseDecisionRule(decision)
    if (rule) publishedById.set(rule.id, rule)
  }

  return baseRules.map((rule) => publishedById.get(rule.id) ?? rule)
}

async function listRuntimeRules(input: {
  context: RpcContext
  jurisdiction?: RuleJurisdiction
  status?: RuleStatus
  includeCandidates?: boolean
}): Promise<CoreObligationRule[]> {
  const baseRuleInput: { jurisdiction?: RuleJurisdiction; includeCandidates: true } = {
    includeCandidates: true,
  }
  if (input.jurisdiction !== undefined) baseRuleInput.jurisdiction = input.jurisdiction
  const baseRules = listObligationRules(baseRuleInput)
  let merged = baseRules
  try {
    const { scoped } = requireTenant(input.context)
    merged = mergeRulesWithDecisions(baseRules, await scoped.rules.listVerified())
  } catch {
    merged = baseRules
  }

  const includeCandidates = input.includeCandidates ?? false
  return merged.filter((rule) => {
    if (input.status && rule.status !== input.status) return false
    if (!includeCandidates && rule.status === 'candidate') return false
    return true
  })
}

const listSources = os.rules.listSources.handler(async ({ input }) => {
  return listRuleSources(input?.jurisdiction).map(toSource)
})

const listRules = os.rules.listRules.handler(async ({ input, context }) => {
  const filters: {
    jurisdiction?: RuleJurisdiction
    status?: RuleStatus
    includeCandidates?: boolean
  } = {}

  if (input?.jurisdiction !== undefined) filters.jurisdiction = input.jurisdiction
  if (input?.status !== undefined) filters.status = input.status
  if (input?.includeCandidates !== undefined) filters.includeCandidates = input.includeCandidates

  return (await listRuntimeRules({ context, ...filters })).map(toContractRule)
})

const listReviewDecisions = os.rules.listReviewDecisions.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const rows = await scoped.rules.listDecisions(input?.status)
  return rows.map(toReviewDecision)
})

const listTemporaryRules = os.rules.listTemporaryRules.handler(async ({ context }) => {
  const { scoped } = requireTenant(context)
  return (await scoped.rules.listTemporaryRules()).map(toTemporaryRule)
})

const verifyCandidate = os.rules.verifyCandidate.handler(async ({ input, context }) => {
  const { scoped, userId } = requireTenant(context)
  await requireCurrentFirmRole(context, ['owner', 'manager'])

  const base = findRuleById(input.ruleId)
  if (!base) throw new ORPCError('NOT_FOUND', { message: 'Rule candidate was not found.' })
  if (base.status !== 'candidate') {
    throw new ORPCError('BAD_REQUEST', { message: 'Only candidate rules can be verified here.' })
  }

  const source = listRuleSources().find((item) => item.id === input.sourceId)
  if (!source) throw new ORPCError('BAD_REQUEST', { message: 'Official source was not found.' })
  if (source.jurisdiction !== base.jurisdiction && source.jurisdiction !== 'FED') {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Official source jurisdiction does not match the candidate rule.',
    })
  }
  if (
    input.coverageStatus === 'full' &&
    !input.requiresApplicabilityReview &&
    input.dueDateLogic.kind === 'source_defined_calendar'
  ) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Full verified rules must use concrete due-date logic.',
    })
  }

  const reviewedAt = new Date()
  const verifiedRule = toCoreRule({
    ...toContractRule(base),
    ruleTier: input.ruleTier,
    status: 'verified',
    coverageStatus: input.coverageStatus,
    requiresApplicabilityReview: input.requiresApplicabilityReview,
    dueDateLogic: input.dueDateLogic,
    extensionPolicy: input.extensionPolicy,
    sourceIds: Array.from(new Set([input.sourceId, ...base.sourceIds])),
    evidence: [
      {
        sourceId: input.sourceId,
        authorityRole: 'basis',
        locator: {
          kind:
            source.sourceType === 'form' || source.acquisitionMethod === 'pdf_watch'
              ? 'pdf'
              : 'html',
          heading: input.sourceHeading,
        },
        summary: `Ops verified ${base.title} against ${source.title}.`,
        sourceExcerpt: input.sourceExcerpt,
        retrievedAt: toDateOnly(reviewedAt),
        ...(input.sourceUpdatedOn ? { sourceUpdatedOn: input.sourceUpdatedOn } : {}),
      },
    ],
    defaultTip: base.defaultTip,
    quality: input.quality,
    verifiedBy: userId,
    verifiedAt: toDateOnly(reviewedAt),
    nextReviewOn: input.nextReviewOn,
    version: base.version + 1,
  })

  const row = await scoped.rules.upsertDecision({
    ruleId: base.id,
    baseVersion: base.version,
    status: 'verified',
    ruleJson: toContractRule(verifiedRule),
    reviewNote: input.reviewNote ?? null,
    reviewedBy: userId,
    reviewedAt,
  })
  await scoped.audit.write({
    actorId: userId,
    entityType: 'rule',
    entityId: base.id,
    action: 'rules.published',
    before: { status: base.status, version: base.version },
    after: { status: 'verified', version: verifiedRule.version, sourceId: input.sourceId },
    ...(input.reviewNote !== undefined ? { reason: input.reviewNote } : {}),
  })
  return toReviewDecision(row)
})

const rejectCandidate = os.rules.rejectCandidate.handler(async ({ input, context }) => {
  const { scoped, userId } = requireTenant(context)
  await requireCurrentFirmRole(context, ['owner', 'manager'])

  const base = findRuleById(input.ruleId)
  if (!base) throw new ORPCError('NOT_FOUND', { message: 'Rule candidate was not found.' })
  if (base.status !== 'candidate') {
    throw new ORPCError('BAD_REQUEST', { message: 'Only candidate rules can be rejected here.' })
  }

  const row = await scoped.rules.upsertDecision({
    ruleId: base.id,
    baseVersion: base.version,
    status: 'rejected',
    ruleJson: null,
    reviewNote: input.reason,
    reviewedBy: userId,
  })
  await scoped.audit.write({
    actorId: userId,
    entityType: 'rule',
    entityId: base.id,
    action: 'rules.review.rejected',
    before: { status: base.status, version: base.version },
    after: { status: 'rejected' },
    reason: input.reason,
  })
  return toReviewDecision(row)
})

const coverage = os.rules.coverage.handler(async ({ context }) => {
  const runtimeRules = await listRuntimeRules({ context, includeCandidates: true })
  return getMvpRuleCoverage().map((row) => {
    const rules = runtimeRules.filter((rule) => rule.jurisdiction === row.jurisdiction)
    return {
      jurisdiction: row.jurisdiction,
      sourceCount: row.sourceCount,
      verifiedRuleCount: rules.filter((rule) => rule.status === 'verified').length,
      candidateCount: rules.filter((rule) => rule.status === 'candidate').length,
      highPrioritySourceCount: row.highPrioritySourceCount,
    }
  })
})

const previewObligations = os.rules.previewObligations.handler(async ({ input, context }) => {
  const generationInput: Parameters<typeof previewObligationsFromRules>[0] = {
    client: {
      id: input.client.id,
      entityType: input.client.entityType,
      state: input.client.state,
      taxTypes: input.client.taxTypes,
    },
  }

  if (input.client.taxYearStart !== undefined) {
    generationInput.client.taxYearStart = input.client.taxYearStart
  }
  if (input.client.taxYearEnd !== undefined) {
    generationInput.client.taxYearEnd = input.client.taxYearEnd
  }
  if (input.holidays !== undefined) {
    generationInput.holidays = input.holidays
  }
  generationInput.rules = await listRuntimeRules({ context, includeCandidates: true })

  return previewObligationsFromRules(generationInput).map(toPreview)
})

export const rulesHandlers = {
  listSources,
  listRules,
  listTemporaryRules,
  listReviewDecisions,
  verifyCandidate,
  rejectCandidate,
  coverage,
  previewObligations,
}
