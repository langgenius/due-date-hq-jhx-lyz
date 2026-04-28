import type * as z from 'zod'
import { callGateway, type GatewayRequest } from './gateway'
import { GuardRejection, verifyMapperEinHitRate } from './guard'
import { redactMigrationInput } from './pii'
import { loadPrompt, type PromptName } from './prompter'
import { createTrace, type AiTrace } from './trace'

export interface AiEnv {
  AI_GATEWAY_ACCOUNT_ID?: string
  AI_GATEWAY_SLUG?: string
  AI_GATEWAY_API_KEY?: string
  AI_GATEWAY_MODEL?: string
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

    if (
      !env.AI_GATEWAY_ACCOUNT_ID ||
      !env.AI_GATEWAY_SLUG ||
      !env.AI_GATEWAY_API_KEY ||
      !env.AI_GATEWAY_MODEL
    ) {
      return refusal(
        'AI_UNAVAILABLE',
        'Cloudflare AI Gateway is not configured for this environment.',
        createTrace({
          promptVersion: name,
          model: prompt.modelTier,
          latencyMs: 0,
          guardResult: 'ai_unavailable',
        }),
      )
    }

    const redacted = redactMigrationInput(input)
    try {
      const gatewayRequest = {
        accountId: env.AI_GATEWAY_ACCOUNT_ID,
        slug: env.AI_GATEWAY_SLUG,
        apiKey: env.AI_GATEWAY_API_KEY,
        model: env.AI_GATEWAY_MODEL,
        prompt: prompt.text,
        input: redacted.input,
        schema,
      } satisfies GatewayRequest<TOut>
      const gateway = await callGateway(gatewayRequest)
      const parsed = schema.safeParse(gateway.output)

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
            model: env.AI_GATEWAY_MODEL ?? prompt.modelTier,
            latencyMs: Date.now() - startedAt,
            guardResult: 'guard_rejected',
          }),
          env.AI_GATEWAY_MODEL ?? prompt.modelTier,
        )
      }

      return refusal(
        'AI_GATEWAY_ERROR',
        error instanceof Error ? error.message : 'AI gateway request failed.',
        createTrace({
          promptVersion: name,
          model: env.AI_GATEWAY_MODEL ?? prompt.modelTier,
          latencyMs: Date.now() - startedAt,
          guardResult: 'schema_fail',
        }),
        env.AI_GATEWAY_MODEL ?? prompt.modelTier,
      )
    }
  }

  return {
    runPrompt,
    runStreaming: runPrompt,
  }
}

export type AI = ReturnType<typeof createAI>
