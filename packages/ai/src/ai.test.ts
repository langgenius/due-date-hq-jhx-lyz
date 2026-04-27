import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { createAI } from './index'
import type { AiPorts, VectorMatch } from './ports'

describe('@duedatehq/ai', () => {
  it('keeps AI dependencies injectable through ports', async () => {
    const match: VectorMatch = { id: 'notice-2026-14', score: 0.9, metadata: { source: 'irs.gov' } }
    const ports: AiPorts = {
      vectors: {
        async query() {
          return [match]
        },
      },
      kv: {
        async get() {
          return null
        },
        async put() {},
      },
      writers: {
        async writeOutput() {},
        async writeLlmLog() {},
        async writeEvidence() {},
      },
      tracer: {
        span() {
          return { end() {} }
        },
      },
      gatewayBaseUrl: 'https://gateway.ai.cloudflare.com',
      openaiApiKey: 'test-openai-key',
      anthropicApiKey: 'test-anthropic-key',
    }

    await expect(ports.vectors.query([], { topK: 1 })).resolves.toEqual([match])
  })

  it('returns a structured refusal when the AI provider is not configured', async () => {
    const ai = createAI({})
    const result = await ai.runPrompt('mapper@v1', { header: [], sample_rows: [] }, z.object({}))

    expect(result.result).toBeNull()
    expect(result.refusal?.code).toBe('AI_UNAVAILABLE')
  })
})
