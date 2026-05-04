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

export interface RulesRepo {
  readonly firmId: string
  listDecisions(status?: RuleReviewDecisionStatus): Promise<RuleReviewDecisionRow[]>
  listVerified(): Promise<RuleReviewDecisionRow[]>
  getDecision(ruleId: string): Promise<RuleReviewDecisionRow | null>
  upsertDecision(input: RuleReviewDecisionInput): Promise<RuleReviewDecisionRow>
}
