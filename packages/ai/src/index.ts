import type { z } from 'zod'
import { callGateway } from './gateway'
import { GuardRejection, verifyMapperEinHitRate } from './guard'
import { redactMigrationInput } from './pii'
import { loadPrompt, type PromptName } from './prompter'
import { createTrace, type AiTrace } from './trace'

export interface AiEnv {
  OPENAI_API_KEY?: string
  AI_GATEWAY_BASE_URL?: string
}

export interface AiRefusal {
  code: 'AI_UNAVAILABLE' | 'GUARD_REJECTED' | 'SCHEMA_INVALID' | 'AI_GATEWAY_ERROR'
  message: string
}

export type AiRunResult<TOut> =
  | {
      result: TOut
      refusal: null
      trace: AiTrace
      model: string
      confidence: number | null
      cost: number | null
    }
  | {
      result: null
      refusal: AiRefusal
      trace: AiTrace
      model: string | null
      confidence: null
      cost: null
    }

function refusal<TOut>(
  code: AiRefusal['code'],
  message: string,
  trace: AiTrace,
  model: string | null = null,
): AiRunResult<TOut> {
  return {
    result: null,
    refusal: { code, message },
    trace,
    model,
    confidence: null,
    cost: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function averageConfidence(value: unknown): number | null {
  if (!isRecord(value)) return null
  const arrays = [value.mappings, Object.values(value)]
  const confidences = arrays
    .flatMap((items) => (Array.isArray(items) ? items : []))
    .map((item) => (isRecord(item) ? item.confidence : undefined))
    .filter((item): item is number => typeof item === 'number')

  if (confidences.length === 0) return null
  return confidences.reduce((sum, item) => sum + item, 0) / confidences.length
}

export function createAI(env: AiEnv = {}) {
  async function runPrompt<TOut>(
    name: PromptName,
    input: unknown,
    schema: z.ZodType<TOut>,
  ): Promise<AiRunResult<TOut>> {
    const prompt = loadPrompt(name)
    const startedAt = Date.now()

    if (!env.OPENAI_API_KEY) {
      return refusal(
        'AI_UNAVAILABLE',
        'AI provider is not configured for this environment.',
        createTrace({
          promptVersion: name,
          model: prompt.model,
          latencyMs: 0,
          guardResult: 'ai_unavailable',
        }),
      )
    }

    const redacted = redactMigrationInput(input)
    try {
      const gatewayRequest = {
        openaiApiKey: env.OPENAI_API_KEY,
        model: prompt.model,
        prompt: prompt.text,
        input: redacted.input,
      }
      const gateway = await callGateway(
        env.AI_GATEWAY_BASE_URL
          ? { ...gatewayRequest, gatewayBaseUrl: env.AI_GATEWAY_BASE_URL }
          : gatewayRequest,
      )
      const parsedJson = JSON.parse(gateway.content) as unknown
      const parsed = schema.safeParse(parsedJson)

      if (!parsed.success) {
        return refusal(
          'SCHEMA_INVALID',
          'AI output did not match the expected schema.',
          createTrace({
            promptVersion: name,
            model: gateway.model,
            latencyMs: Date.now() - startedAt,
            guardResult: 'schema_fail',
            ...(gateway.tokens ? { tokens: gateway.tokens } : {}),
            ...(gateway.costUsd !== undefined ? { costUsd: gateway.costUsd } : {}),
          }),
          gateway.model,
        )
      }

      if (name === 'mapper@v1') verifyMapperEinHitRate(input, parsed.data)

      const trace = createTrace({
        promptVersion: name,
        model: gateway.model,
        latencyMs: Date.now() - startedAt,
        guardResult: 'ok',
        ...(gateway.tokens ? { tokens: gateway.tokens } : {}),
        ...(gateway.costUsd !== undefined ? { costUsd: gateway.costUsd } : {}),
      })

      return {
        result: parsed.data,
        refusal: null,
        trace,
        model: gateway.model,
        confidence: averageConfidence(parsed.data),
        cost: gateway.costUsd ?? null,
      }
    } catch (error) {
      if (error instanceof GuardRejection) {
        return refusal(
          'GUARD_REJECTED',
          error.message,
          createTrace({
            promptVersion: name,
            model: prompt.model,
            latencyMs: Date.now() - startedAt,
            guardResult: 'guard_rejected',
          }),
          prompt.model,
        )
      }

      return refusal(
        'AI_GATEWAY_ERROR',
        error instanceof Error ? error.message : 'AI gateway request failed.',
        createTrace({
          promptVersion: name,
          model: prompt.model,
          latencyMs: Date.now() - startedAt,
          guardResult: 'schema_fail',
        }),
        prompt.model,
      )
    }
  }

  return {
    runPrompt,
    runStreaming: runPrompt,
  }
}

export type AI = ReturnType<typeof createAI>
