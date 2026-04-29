import type { AiOutputKind } from './shared'

export interface AiTraceInput {
  promptVersion: string
  model: string | null
  latencyMs: number
  guardResult: string
  inputHash: string
  refusalCode?: string | null
  tokens?: {
    input?: number
    output?: number
  }
  costUsd?: number
}

export interface RecordAiRunInput {
  userId: string | null
  kind: AiOutputKind
  inputContextRef: string
  trace: AiTraceInput
  outputText?: string | null
  citations?: unknown
  errorMsg?: string | null
}

export interface AiRepo {
  readonly firmId: string
  recordRun(input: RecordAiRunInput): Promise<{ aiOutputId: string; llmLogId: string }>
}
