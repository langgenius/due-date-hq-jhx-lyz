// Injection surface — dependencies reach @duedatehq/ai via these ports, never via direct imports.

export interface VectorStore {
  query(
    embedding: number[],
    opts: { topK: number; filter?: Record<string, string> },
  ): Promise<VectorMatch[]>
}

export interface VectorMatch {
  id: string
  score: number
  metadata: Record<string, unknown>
}

export interface KvStore {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}

export interface AiWriters {
  writeOutput(payload: unknown): Promise<void>
  writeLlmLog(payload: unknown): Promise<void>
  writeEvidence(payload: unknown): Promise<void>
}

export interface Tracer {
  span(name: string, meta?: Record<string, unknown>): { end(result?: unknown): void }
}

export interface AiPorts {
  vectors: VectorStore
  kv: KvStore
  writers: AiWriters
  tracer: Tracer
  aiGatewayAccountId: string
  aiGatewaySlug: string
  aiGatewayApiKey: string
  aiGatewayModelFastJson: string
  aiGatewayModelQualityJson: string
  aiGatewayModelReasoning: string
}
