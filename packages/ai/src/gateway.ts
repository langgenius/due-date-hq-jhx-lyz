import { createAiGateway } from 'ai-gateway-provider'
import { createUnified } from 'ai-gateway-provider/providers/unified'
import { generateText, Output } from 'ai'
import * as z from 'zod'

export interface GatewayRequest<TOut> {
  accountId: string
  slug: string
  apiKey: string
  model: string
  prompt: string
  input: unknown
  schema: z.ZodType<TOut>
}

export interface GatewayResponse<TOut> {
  output: TOut
  model: string
  tokens?: { input?: number; output?: number }
  costUsd?: number
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readUsage(value: unknown): GatewayResponse<unknown>['tokens'] {
  if (!isRecord(value)) return undefined

  const input =
    optionalNumber(value.inputTokens) ??
    optionalNumber(value.promptTokens) ??
    optionalNumber(value.input) ??
    optionalNumber(value.prompt_tokens)
  const output =
    optionalNumber(value.outputTokens) ??
    optionalNumber(value.completionTokens) ??
    optionalNumber(value.output) ??
    optionalNumber(value.completion_tokens)

  if (input === undefined && output === undefined) return undefined

  const tokens: NonNullable<GatewayResponse<unknown>['tokens']> = {}
  if (input !== undefined) tokens.input = input
  if (output !== undefined) tokens.output = output
  return tokens
}

export async function callGateway<TOut>(
  request: GatewayRequest<TOut>,
): Promise<GatewayResponse<TOut>> {
  const aiGateway = createAiGateway({
    accountId: request.accountId,
    gateway: request.slug,
    apiKey: request.apiKey,
  })
  const unified = createUnified()

  const result = await generateText({
    model: aiGateway(unified(request.model)),
    system: request.prompt,
    prompt: JSON.stringify(request.input),
    output: Output.object({ schema: request.schema }),
    temperature: 0,
  })

  const response: GatewayResponse<TOut> = {
    output: request.schema.parse(result.output),
    model: request.model,
  }
  const tokens = readUsage(result.usage)
  if (tokens) response.tokens = tokens
  return response
}
