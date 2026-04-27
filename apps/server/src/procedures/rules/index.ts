import type { ObligationRule, RuleSource } from '@duedatehq/contracts'
import {
  getMvpRuleCoverage,
  listObligationRules,
  listRuleSources,
  type DueDateLogic,
  type RuleJurisdiction,
  type RuleStatus,
} from '@duedatehq/core/rules'
import { os } from '../_root'

function toDueDateLogic(logic: DueDateLogic): ObligationRule['dueDateLogic'] {
  if (logic.kind === 'period_table') {
    return {
      ...logic,
      periods: logic.periods.map((period) => ({ ...period })),
    }
  }

  return { ...logic }
}

function toSource(source: ReturnType<typeof listRuleSources>[number]): RuleSource {
  return {
    ...source,
    notificationChannels: [...source.notificationChannels],
  }
}

function toRule(rule: ReturnType<typeof listObligationRules>[number]): ObligationRule {
  return {
    ...rule,
    entityApplicability: [...rule.entityApplicability],
    dueDateLogic: toDueDateLogic(rule.dueDateLogic),
    sourceIds: [...rule.sourceIds],
    evidence: rule.evidence.map((item) => ({ ...item })),
    quality: { ...rule.quality },
    extensionPolicy: { ...rule.extensionPolicy },
  }
}

const listSources = os.rules.listSources.handler(async ({ input }) => {
  return listRuleSources(input?.jurisdiction).map(toSource)
})

const listRules = os.rules.listRules.handler(async ({ input }) => {
  const filters: {
    jurisdiction?: RuleJurisdiction
    status?: RuleStatus
    includeCandidates?: boolean
  } = {}

  if (input?.jurisdiction !== undefined) filters.jurisdiction = input.jurisdiction
  if (input?.status !== undefined) filters.status = input.status
  if (input?.includeCandidates !== undefined) filters.includeCandidates = input.includeCandidates

  return listObligationRules(filters).map(toRule)
})

const coverage = os.rules.coverage.handler(async () => {
  return [...getMvpRuleCoverage()]
})

export const rulesHandlers = {
  listSources,
  listRules,
  coverage,
}
