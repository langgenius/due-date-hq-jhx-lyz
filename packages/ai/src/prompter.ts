import mapperV1 from './prompts/mapper@v1.md?raw'
import normalizerEntityV1 from './prompts/normalizer-entity@v1.md?raw'
import normalizerTaxTypesV1 from './prompts/normalizer-tax-types@v1.md?raw'

export interface PromptDefinition {
  name: string
  text: string
  model: string
  fallbackModel: string | null
  temperature: number
  responseFormat: 'json_object'
  route: string
}

const prompts = {
  'mapper@v1': mapperV1,
  'normalizer-entity@v1': normalizerEntityV1,
  'normalizer-tax-types@v1': normalizerTaxTypesV1,
} as const

export type PromptName = keyof typeof prompts

export function loadPrompt(name: PromptName): PromptDefinition {
  const text = prompts[name]
  const modelLine = /^model:\s*(.+)$/m.exec(text)?.[1] ?? 'openai/gpt-4o-mini'
  const fallbackMatch = /\(fallback:\s*([^)]+)\)/.exec(modelLine)
  const model = modelLine.replace(/\s*\(fallback:[^)]+\)/, '').trim()

  return {
    name,
    text,
    model,
    fallbackModel: fallbackMatch?.[1]?.trim() ?? null,
    temperature: 0,
    responseFormat: 'json_object',
    route: 'via Cloudflare AI Gateway + OpenAI ZDR endpoint',
  }
}
