export type RuleReviewDecisionStatus = 'verified' | 'rejected'

export interface RuleReviewDecisionRow {
  id: string
  firmId: string
  ruleId: string
  baseVersion: number
  status: RuleReviewDecisionStatus
  ruleJson: unknown
  reviewNote: string | null
  reviewedBy: string
  reviewedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface RuleReviewDecisionInput {
  ruleId: string
  baseVersion: number
  status: RuleReviewDecisionStatus
  ruleJson: unknown
  reviewNote: string | null
  reviewedBy: string
  reviewedAt?: Date
}

export type TemporaryRuleRowStatus = 'active' | 'reverted' | 'retracted'

export interface TemporaryRuleRow {
  id: string
  alertId: string | null
  sourcePulseId: string | null
  title: string
  sourceUrl: string | null
  sourceExcerpt: string | null
  jurisdiction: string
  counties: string[]
  affectedForms: string[]
  affectedEntityTypes: string[]
  overrideType: 'extend_due_date' | 'waive_penalty'
  overrideDueDate: Date | null
  effectiveFrom: Date | null
  effectiveUntil: Date | null
  status: TemporaryRuleRowStatus
  appliedObligationCount: number
  activeObligationCount: number
  revertedObligationCount: number
  firstAppliedAt: Date | null
  lastActivityAt: Date
}

export interface RulesRepo {
  readonly firmId: string
  listDecisions(status?: RuleReviewDecisionStatus): Promise<RuleReviewDecisionRow[]>
  listVerified(): Promise<RuleReviewDecisionRow[]>
  listTemporaryRules(): Promise<TemporaryRuleRow[]>
  getDecision(ruleId: string): Promise<RuleReviewDecisionRow | null>
  upsertDecision(input: RuleReviewDecisionInput): Promise<RuleReviewDecisionRow>
}
