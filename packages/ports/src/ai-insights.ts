export type AiInsightKind = 'client_risk_summary' | 'deadline_tip'
export type AiInsightSubjectType = 'client' | 'obligation'
export type AiInsightStatus = 'pending' | 'ready' | 'failed' | 'stale'

export interface AiInsightRow {
  id: string
  firmId: string
  kind: AiInsightKind
  subjectType: AiInsightSubjectType
  subjectId: string
  asOfDate: string
  status: AiInsightStatus
  inputHash: string
  aiOutputId: string | null
  output: unknown
  citations: unknown
  reason: string
  errorCode: string | null
  generatedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AiInsightCreatePendingInput {
  id?: string
  kind: AiInsightKind
  subjectType: AiInsightSubjectType
  subjectId: string
  asOfDate: string
  inputHash: string
  reason: string
  output?: unknown
  citations?: unknown
  generatedAt?: Date | null
  expiresAt?: Date | null
  now?: Date
}

export interface AiInsightReadyInput {
  aiOutputId?: string | null
  output: unknown
  citations?: unknown
  generatedAt: Date
  expiresAt: Date
}

export interface AiInsightFailedInput {
  aiOutputId?: string | null
  errorCode: string
  generatedAt: Date
  expiresAt: Date
}

export interface AiInsightsRepo {
  readonly firmId: string
  findLatest(input: {
    kind: AiInsightKind
    subjectType: AiInsightSubjectType
    subjectId: string
    asOfDate: string
    now?: Date
  }): Promise<AiInsightRow | null>
  findByHash(input: {
    kind: AiInsightKind
    subjectType: AiInsightSubjectType
    subjectId: string
    asOfDate: string
    inputHash: string
    statuses?: AiInsightStatus[]
    now?: Date
  }): Promise<AiInsightRow | null>
  createPending(input: AiInsightCreatePendingInput): Promise<AiInsightRow>
  markReady(id: string, input: AiInsightReadyInput): Promise<AiInsightRow>
  markFailed(id: string, input: AiInsightFailedInput): Promise<AiInsightRow>
}
