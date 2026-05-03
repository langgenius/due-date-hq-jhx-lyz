export interface AiTrace {
  promptVersion: string
  model: string
  latencyMs: number
  guardResult: 'ok' | 'schema_fail' | 'guard_rejected' | 'ai_unavailable' | 'budget_exceeded'
  inputHash: string
  refusalCode?: string
  tokens?: { input?: number; output?: number }
  costUsd?: number
}

export function createTrace(payload: AiTrace): AiTrace {
  return payload
}
