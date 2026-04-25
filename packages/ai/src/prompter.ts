/**
 * Prompt registry — keeps the canonical prompt text + model coordinates next
 * to the runtime so apps/server's wrangler/esbuild bundle is portable
 * (no `?raw` Vite-only loader). The matching markdown files in `./prompts/`
 * are the editorial source of truth and stay in version control as docs.
 *
 * Authority for content:
 *   - docs/product-design/migration-copilot/04-ai-prompts.md (text drafts)
 *   - PRD Part1B §6A.2 / §6A.3 (Mapper / Normalizer specs)
 */

const MAPPER_V1 = `prompt_version: mapper@v1
model: openai/gpt-4o-mini (fallback: anthropic/claude-3-5-haiku)
temperature: 0
response_format: json_object
route: via Cloudflare AI Gateway + OpenAI ZDR endpoint

You are a data mapping assistant for a US tax deadline tool.
Given a spreadsheet's header and a 5-row sample, map each column to
one of the DueDateHQ target fields. Output strict JSON only.

For EIN detection:

- EIN format is "##-#######" (9 digits with a dash after the first 2).
- If a column contains values matching this pattern, map to "client.ein".

For each source column, output:
{
"source": "<header>",
"target": "<field|IGNORE>",
"confidence": 0.0-1.0,
"reasoning": "<one sentence, <= 20 words>",
"sample_transformed": "<example of first row after mapping>"
}

Rules:

- If unclear, set target=IGNORE and confidence below 0.5.
- Never invent target fields not listed above.
- Explain every decision in <= 20 words.
- PII note: you only see this 5-row sample, not the full dataset.

ZDR: Do not retain any data seen for training.
This request is routed through a Zero Data Retention endpoint.
PII handling: field names and 5-row sample only — no placeholders used.
`

const NORMALIZER_ENTITY_V1 = `prompt_version: normalizer-entity@v1
model: openai/gpt-4o-mini (fallback: anthropic/claude-3-5-haiku)
temperature: 0
response_format: json_object
route: via Cloudflare AI Gateway + OpenAI ZDR endpoint

You are a data normalization assistant for a US tax deadline tool.
Given a list of raw entity-type strings (from a CSV column), map each
raw value to exactly one of these 8 canonical values:

llc, s_corp, partnership, c_corp, sole_prop, trust, individual, other

Output strict JSON only, keyed by the raw value:

{
"<raw>": {
"normalized": "<canonical>",
"confidence": 0.0-1.0,
"reasoning": "<one sentence, <= 20 words>"
}
}

Rules:

- If the raw value is ambiguous, set normalized="other" and confidence below 0.5.
- Never invent a canonical value outside the 8 listed above.
- Do not emit any keys other than the raw values provided.
- Case-insensitive; ignore surrounding whitespace and punctuation.

ZDR: Do not retain any data seen for training.
This request is routed through a Zero Data Retention endpoint.
PII handling: enumerated field values only — no placeholders used.
`

const NORMALIZER_TAX_TYPES_V1 = `prompt_version: normalizer-tax-types@v1
model: openai/gpt-4o-mini (fallback: anthropic/claude-3-5-haiku)
temperature: 0
response_format: json_object
route: via Cloudflare AI Gateway + OpenAI ZDR endpoint

You are a data normalization assistant for a US tax deadline tool.
Given a list of raw tax-type / tax-return strings and an optional
jurisdiction hint (one of: federal, CA, NY), map each raw value to one
or more canonical tax_type IDs from DueDateHQ's Default Matrix vocabulary:

federal_1040, federal_1040_sch_c, federal_1041, federal_1065,
federal_1065_or_1040, federal_1120, federal_1120s, federal,
ca_540, ca_541, ca_100_franchise, ca_100s_franchise,
ca_565_partnership, ca_llc_franchise_min_800,
ca_llc_fee_gross_receipts, ca_ptet_optional,
ny_it201, ny_it204, ny_it205, ny_ct3, ny_ct3s,
ny_llc_filing_fee, ny_ptet_optional

Output strict JSON only, keyed by the raw value:

{
"<raw>": {
"normalized": ["<id1>", "<id2>"],
"confidence": 0.0-1.0,
"reasoning": "<one sentence, <= 20 words>"
}
}

Rules:

- If the raw value is ambiguous or outside the vocabulary, set normalized=[]
  and confidence below 0.5 — do not invent IDs.
- Prefer the narrowest match; if jurisdiction is provided, prefer that jurisdiction.
- Case-insensitive; ignore punctuation and common prefixes ("Form", "IRS", "#").
- Do not emit any keys other than the raw values provided.

ZDR: Do not retain any data seen for training.
This request is routed through a Zero Data Retention endpoint.
PII handling: enumerated field values only — no placeholders used.
`

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
  'mapper@v1': MAPPER_V1,
  'normalizer-entity@v1': NORMALIZER_ENTITY_V1,
  'normalizer-tax-types@v1': NORMALIZER_TAX_TYPES_V1,
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
