export interface EvidenceInput {
  firmId: string
  obligationInstanceId?: string | null
  aiOutputId?: string | null
  sourceType: string
  sourceId?: string | null
  sourceUrl?: string | null
  verbatimQuote?: string | null
  rawValue?: string | null
  normalizedValue?: string | null
  confidence?: number | null
  model?: string | null
  matrixVersion?: string | null
  verifiedAt?: Date | null
  verifiedBy?: string | null
  appliedAt?: Date
  appliedBy?: string | null
}

export interface EvidenceLinkRow {
  id: string
  firmId: string
  obligationInstanceId: string | null
  aiOutputId: string | null
  sourceType: string
  sourceId: string | null
  sourceUrl: string | null
  verbatimQuote: string | null
  rawValue: string | null
  normalizedValue: string | null
  confidence: number | null
  model: string | null
  matrixVersion: string | null
  verifiedAt: Date | null
  verifiedBy: string | null
  appliedAt: Date
  appliedBy: string | null
}

export interface EvidenceRepo {
  readonly firmId: string
  write(input: Omit<EvidenceInput, 'firmId'>): Promise<{ id: string }>
  writeBatch(inputs: Array<Omit<EvidenceInput, 'firmId'>>): Promise<{ ids: string[] }>
  listByObligation(obligationInstanceId: string): Promise<EvidenceLinkRow[]>
}
