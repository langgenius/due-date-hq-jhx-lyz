import { ObligationRuleSchema, type AnnualRolloverOutput } from '@duedatehq/contracts'
import { defaultReadinessForStatus } from '@duedatehq/core/obligation-workflow'
import {
  listObligationRules,
  listRuleSources,
  previewObligationsFromRules,
  STATE_RULE_JURISDICTIONS,
  type ObligationGenerationPreview,
  type ObligationRule,
  type RuleGenerationState,
} from '@duedatehq/core/rules'
import {
  buildPenaltyFactsFromLegacy,
  estimateProjectedExposure,
  PENALTY_FACTS_VERSION,
} from '@duedatehq/core/penalty'
import type { ObligationCreateInput } from '@duedatehq/ports/obligations'
import type { ScopedRepo } from '@duedatehq/ports/scoped'
import { toCoreRule } from '../rules/runtime'

type AnnualRolloverInput = {
  sourceFilingYear: number
  targetFilingYear: number
  clientIds?: string[] | undefined
}

type AnnualRolloverMode = 'preview' | 'create'

type SourceBucket = {
  clientId: string
  taxType: string
  sourceObligationIds: string[]
}

const RULE_GENERATION_STATES = new Set<string>(STATE_RULE_JURISDICTIONS)

function isRuleGenerationState(value: string | null | undefined): value is RuleGenerationState {
  return typeof value === 'string' && RULE_GENERATION_STATES.has(value)
}

function rolloverDates(targetFilingYear: number): { taxYearStart: string; taxYearEnd: string } {
  return {
    taxYearStart: `${targetFilingYear}-01-01`,
    taxYearEnd: `${targetFilingYear - 1}-12-31`,
  }
}

function keyForDuplicate(input: {
  clientId: string
  ruleId: string
  taxYear: number | null
  rulePeriod: string
}): string {
  return `${input.clientId}::${input.ruleId}::${input.taxYear ?? ''}::${input.rulePeriod}`
}

async function listRuntimeRules(
  scoped: ScopedRepo,
  rules?: readonly ObligationRule[],
): Promise<ObligationRule[]> {
  if (rules) return [...rules]

  const mergedById = new Map(
    listObligationRules({ includeCandidates: true }).map((rule) => [rule.id, rule]),
  )
  const decisions = await scoped.rules.listVerified()
  for (const decision of decisions) {
    if (!decision.ruleJson) continue
    const parsed = ObligationRuleSchema.safeParse(decision.ruleJson)
    if (parsed.success) mergedById.set(parsed.data.id, toCoreRule(parsed.data))
  }
  return [...mergedById.values()]
}

function groupSeedBuckets(
  seeds: Awaited<ReturnType<ScopedRepo['obligations']['listAnnualRolloverSeeds']>>,
): SourceBucket[] {
  const buckets = new Map<string, SourceBucket>()
  for (const seed of seeds) {
    const key = `${seed.clientId}::${seed.taxType}`
    const current =
      buckets.get(key) ??
      ({
        clientId: seed.clientId,
        taxType: seed.taxType,
        sourceObligationIds: [],
      } satisfies SourceBucket)
    current.sourceObligationIds.push(seed.id)
    buckets.set(key, current)
  }
  return [...buckets.values()]
}

function summarize(
  output: Omit<AnnualRolloverOutput, 'summary'>,
  input: {
    sourceFilingYear: number
    targetFilingYear: number
    seedObligationCount: number
  },
): AnnualRolloverOutput['summary'] {
  return {
    sourceFilingYear: input.sourceFilingYear,
    targetFilingYear: input.targetFilingYear,
    seedObligationCount: input.seedObligationCount,
    clientCount: new Set(output.rows.map((row) => row.clientId)).size,
    willCreateCount: output.rows.filter((row) => row.disposition === 'will_create').length,
    reviewCount: output.rows.filter((row) => row.disposition === 'review').length,
    duplicateCount: output.rows.filter((row) => row.disposition === 'duplicate').length,
    skippedCount: output.rows.filter(
      (row) =>
        row.disposition === 'missing_verified_rule' || row.disposition === 'missing_due_date',
    ).length,
    createdCount: output.rows.filter((row) => row.createdObligationId).length,
  }
}

function sourceUrlForPreview(
  preview: ObligationGenerationPreview,
  sourceById: ReadonlyMap<string, ReturnType<typeof listRuleSources>[number]>,
): string | null {
  const sourceId = preview.evidence[0]?.sourceId ?? preview.sourceIds[0]
  return sourceId ? (sourceById.get(sourceId)?.url ?? null) : null
}

function previewForOutput(
  preview: ObligationGenerationPreview,
): NonNullable<AnnualRolloverOutput['rows'][number]['preview']> {
  return {
    ...preview,
    sourceIds: [...preview.sourceIds],
    evidence: preview.evidence.map((evidence) => ({
      ...evidence,
      locator: { ...evidence.locator },
    })),
    reviewReasons: [...preview.reviewReasons],
  }
}

export async function runAnnualRollover(input: {
  scoped: ScopedRepo
  userId: string
  params: AnnualRolloverInput
  mode: AnnualRolloverMode
  rules?: readonly ObligationRule[]
  now?: Date
}): Promise<AnnualRolloverOutput> {
  const now = input.now ?? new Date()
  const seedInput: { sourceFilingYear: number; clientIds?: string[] } = {
    sourceFilingYear: input.params.sourceFilingYear,
  }
  if (input.params.clientIds !== undefined) seedInput.clientIds = input.params.clientIds
  const seeds = await input.scoped.obligations.listAnnualRolloverSeeds(seedInput)
  const buckets = groupSeedBuckets(seeds)
  const clients = await input.scoped.clients.findManyByIds([
    ...new Set(buckets.map((b) => b.clientId)),
  ])
  const clientById = new Map(clients.map((client) => [client.id, client]))
  const runtimeRules = (await listRuntimeRules(input.scoped, input.rules)).filter(
    (rule) => rule.status === 'verified' && rule.applicableYear === input.params.targetFilingYear,
  )
  const ruleById = new Map(runtimeRules.map((rule) => [rule.id, rule]))
  const duplicateRows = await input.scoped.obligations.listGeneratedByClientAndTaxYears({
    clientIds: clients.map((client) => client.id),
    taxYears: [...new Set(runtimeRules.map((rule) => rule.taxYear))],
  })
  const duplicates = new Map(
    duplicateRows
      .filter((row) => row.ruleId && row.taxYear !== null && row.rulePeriod)
      .map((row) => [
        keyForDuplicate({
          clientId: row.clientId,
          ruleId: row.ruleId!,
          taxYear: row.taxYear,
          rulePeriod: row.rulePeriod!,
        }),
        row.id,
      ]),
  )
  const sourceById = new Map(listRuleSources().map((source) => [source.id, source]))
  const rows: AnnualRolloverOutput['rows'] = []
  const createInputs: Array<ObligationCreateInput & { preview: ObligationGenerationPreview }> = []

  for (const clientId of new Set(buckets.map((bucket) => bucket.clientId))) {
    const client = clientById.get(clientId)
    const clientBuckets = buckets.filter((bucket) => bucket.clientId === clientId)
    if (!client || !isRuleGenerationState(client.state)) {
      for (const bucket of clientBuckets) {
        rows.push({
          clientId,
          clientName: client?.name ?? clientId,
          taxType: bucket.taxType,
          sourceObligationIds: bucket.sourceObligationIds,
          preview: null,
          disposition: 'missing_verified_rule',
          targetStatus: null,
          duplicateObligationId: null,
          createdObligationId: null,
          skippedReason: client ? 'client_state_missing' : 'client_not_found',
        })
      }
      continue
    }

    const { taxYearStart, taxYearEnd } = rolloverDates(input.params.targetFilingYear)
    const previews = previewObligationsFromRules({
      client: {
        id: client.id,
        entityType: client.entityType,
        state: client.state,
        taxTypes: clientBuckets.map((bucket) => bucket.taxType),
        taxYearStart,
        taxYearEnd,
      },
      rules: runtimeRules,
    })
    const previewsByMatchedTaxType = new Map<string, ObligationGenerationPreview[]>()
    for (const preview of previews) {
      const list = previewsByMatchedTaxType.get(preview.matchedTaxType) ?? []
      list.push(preview)
      previewsByMatchedTaxType.set(preview.matchedTaxType, list)
    }

    for (const bucket of clientBuckets) {
      const matchedPreviews = previewsByMatchedTaxType.get(bucket.taxType) ?? []
      if (matchedPreviews.length === 0) {
        rows.push({
          clientId: client.id,
          clientName: client.name,
          taxType: bucket.taxType,
          sourceObligationIds: bucket.sourceObligationIds,
          preview: null,
          disposition: 'missing_verified_rule',
          targetStatus: null,
          duplicateObligationId: null,
          createdObligationId: null,
          skippedReason: 'no_verified_rule_for_target_year',
        })
        continue
      }

      for (const preview of matchedPreviews) {
        const rule = ruleById.get(preview.ruleId)
        const duplicateId = rule
          ? duplicates.get(
              keyForDuplicate({
                clientId: client.id,
                ruleId: rule.id,
                taxYear: rule.taxYear,
                rulePeriod: preview.period,
              }),
            )
          : undefined
        const targetStatus = preview.reminderReady ? 'pending' : 'review'
        const disposition = duplicateId
          ? 'duplicate'
          : preview.dueDate
            ? targetStatus === 'pending'
              ? 'will_create'
              : 'review'
            : 'missing_due_date'
        const row: AnnualRolloverOutput['rows'][number] = {
          clientId: client.id,
          clientName: client.name,
          taxType: preview.taxType,
          sourceObligationIds: bucket.sourceObligationIds,
          preview: previewForOutput(preview),
          disposition,
          targetStatus:
            disposition === 'will_create' || disposition === 'review' ? targetStatus : null,
          duplicateObligationId: duplicateId ?? null,
          createdObligationId: null,
          skippedReason:
            disposition === 'duplicate'
              ? 'target_obligation_already_exists'
              : disposition === 'missing_due_date'
                ? 'verified_rule_has_no_concrete_due_date'
                : null,
        }
        rows.push(row)

        if (input.mode !== 'create' || !rule || !preview.dueDate || duplicateId) continue

        const dueDate = new Date(`${preview.dueDate}T00:00:00.000Z`)
        const penaltyFacts = buildPenaltyFactsFromLegacy({
          taxType: preview.taxType,
          estimatedTaxLiabilityCents: client.estimatedTaxLiabilityCents,
          equityOwnerCount: client.equityOwnerCount,
        })
        const exposure = estimateProjectedExposure({
          jurisdiction: preview.jurisdiction,
          taxType: preview.taxType,
          entityType: client.entityType,
          dueDate,
          asOfDate: now,
          penaltyFactsJson: penaltyFacts,
        })
        createInputs.push({
          clientId: client.id,
          taxType: preview.taxType,
          taxYear: rule.taxYear,
          ruleId: rule.id,
          ruleVersion: preview.ruleVersion,
          rulePeriod: preview.period,
          generationSource: 'annual_rollover',
          baseDueDate: dueDate,
          currentDueDate: dueDate,
          status: targetStatus,
          readiness: defaultReadinessForStatus(targetStatus, undefined),
          estimatedTaxDueCents: exposure.estimatedTaxDueCents,
          estimatedExposureCents: exposure.estimatedExposureCents,
          exposureStatus: exposure.status,
          penaltyFactsJson: penaltyFacts,
          penaltyFactsVersion: PENALTY_FACTS_VERSION,
          penaltyBreakdownJson: exposure.breakdown,
          penaltyFormulaVersion: exposure.formulaVersion,
          missingPenaltyFactsJson: exposure.missingPenaltyFacts,
          penaltySourceRefsJson: exposure.penaltySourceRefs,
          penaltyFormulaLabel: exposure.penaltyFormulaLabel,
          exposureCalculatedAt: now,
          preview,
        })
      }
    }
  }

  let auditId: string | null = null
  if (input.mode === 'create' && createInputs.length > 0) {
    const { ids } = await input.scoped.obligations.createBatch(createInputs)
    ids.forEach((id, index) => {
      const created = createInputs[index]
      if (!created) return
      const row = rows.find(
        (candidate) =>
          candidate.preview?.ruleId === created.preview.ruleId &&
          candidate.preview.period === created.preview.period &&
          candidate.clientId === created.clientId,
      )
      if (row) row.createdObligationId = id
    })
    await input.scoped.evidence.writeBatch(
      createInputs.map((created, index) => ({
        obligationInstanceId: ids[index] ?? null,
        aiOutputId: null,
        sourceType: 'verified_rule',
        sourceId: created.preview.ruleId,
        sourceUrl: sourceUrlForPreview(created.preview, sourceById),
        verbatimQuote: created.preview.evidence[0]?.sourceExcerpt ?? null,
        rawValue: created.preview.matchedTaxType,
        normalizedValue: created.preview.taxType,
        confidence: created.preview.reminderReady ? 1 : 0.7,
        model: null,
        matrixVersion: null,
        verifiedAt: null,
        verifiedBy: null,
        appliedAt: now,
        appliedBy: input.userId,
      })),
    )
    const audit = await input.scoped.audit.write({
      actorId: input.userId,
      entityType: 'obligation_batch',
      entityId: ids[0] ?? 'empty',
      action: 'obligation.annual_rollover.created',
      after: {
        sourceFilingYear: input.params.sourceFilingYear,
        targetFilingYear: input.params.targetFilingYear,
        createdCount: ids.length,
        createdObligationIds: ids,
      },
    })
    auditId = audit.id
  }

  const output = { rows, auditId }
  return {
    summary: summarize(output, {
      sourceFilingYear: input.params.sourceFilingYear,
      targetFilingYear: input.params.targetFilingYear,
      seedObligationCount: seeds.length,
    }),
    rows,
    auditId,
  }
}
