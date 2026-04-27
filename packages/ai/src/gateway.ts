import * as z from 'zod'

export interface GatewayRequest {
  gatewayBaseUrl?: string
  openaiApiKey: string
  model: string
  prompt: string
  input: unknown
}

export interface GatewayResponse {
  content: string
  model: string
  tokens?: { input?: number; output?: number }
  costUsd?: number
}

const GatewayJsonSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().optional() }).optional() }))
    .optional(),
  model: z.string().optional(),
  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
    })
    .optional(),
})

export async function callGateway(request: GatewayRequest): Promise<GatewayResponse> {
  const endpoint = request.gatewayBaseUrl
    ? `${request.gatewayBaseUrl.replace(/\/$/, '')}/chat/completions`
    : 'https://api.openai.com/v1/chat/completions'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${request.openaiApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model.replace(/^openai\//, ''),
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: request.prompt },
        { role: 'user', content: JSON.stringify(request.input) },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`AI gateway request failed: ${response.status}`)
  }

  const json = GatewayJsonSchema.parse(await response.json())
  const tokens: GatewayResponse['tokens'] = {}
  if (json.usage?.prompt_tokens !== undefined) tokens.input = json.usage.prompt_tokens
  if (json.usage?.completion_tokens !== undefined) tokens.output = json.usage.completion_tokens

  return {
    content: json.choices?.[0]?.message?.content ?? '{}',
    model: json.model ?? request.model,
    tokens,
  }
}
